import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { refineStock } from '@/lib/claude';
import type { IdeaStock } from '@/types';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { data, error } = await supabase
    .from('idea_stocks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'ストックが見つかりません' }, { status: 404 });
  }

  const stock = data as IdeaStock;

  // 関連ストックのタイトル・要約を取得してコンテキストに含める
  let relatedStocks: { title: string; summary: string | null }[] = [];
  if (stock.related_ids && stock.related_ids.length > 0) {
    const { data: related } = await supabase
      .from('idea_stocks')
      .select('title, summary')
      .in('id', stock.related_ids);
    relatedStocks = related ?? [];
  }

  try {
    const result = await refineStock(stock, {
      variations: stock.variations?.map((v) => ({ title: v.title, shared_core: v.shared_core })) ?? [],
      relatedStocks,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '改善に失敗しました' },
      { status: 500 }
    );
  }
}
