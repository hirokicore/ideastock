import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectSimilarStocks } from '@/lib/claude';
import type { SimilarCandidate } from '@/types';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body = await request.json() as {
    title: string;
    summary: string;
    tags: string[];
  };

  // Fetch existing stocks (lightweight fields only)
  const { data: existing } = await supabase
    .from('idea_stocks')
    .select('id, title, summary, tags')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!existing || existing.length === 0) {
    return NextResponse.json({ candidates: [] });
  }

  try {
    const result = await detectSimilarStocks(body, existing);

    // Enrich candidates with title/summary from DB
    const enriched: SimilarCandidate[] = result.candidates
      .map((c) => {
        const stock = existing.find((s) => s.id === c.id);
        if (!stock) return null;
        return {
          id: c.id,
          title: stock.title,
          summary: stock.summary ?? null,
          similarity_type: c.similarity_type,
          reason: c.reason,
        };
      })
      .filter((c): c is SimilarCandidate => c !== null);

    return NextResponse.json({ candidates: enriched });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '類似検索に失敗しました' },
      { status: 500 }
    );
  }
}
