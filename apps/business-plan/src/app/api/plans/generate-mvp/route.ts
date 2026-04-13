import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateMvpPlan } from '@/lib/claude';
import type { IdeaSnapshot, MvpGenerateResult } from '@/types';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { source_idea_id } = await request.json() as { source_idea_id: string };
  if (!source_idea_id) {
    return NextResponse.json({ error: 'source_idea_id が必要です' }, { status: 400 });
  }

  // Fetch from idea_stocks (same Supabase project, RLS allows user's own data)
  const { data: idea, error } = await supabase
    .from('idea_stocks')
    .select('id, title, summary, tags, idea_list, recommend_score')
    .eq('id', source_idea_id)
    .eq('user_id', user.id)
    .single();

  if (error || !idea) {
    return NextResponse.json({ error: 'アイデアが見つかりません' }, { status: 404 });
  }

  const snapshot: IdeaSnapshot = {
    id:              idea.id,
    title:           idea.title,
    summary:         idea.summary ?? null,
    tags:            idea.tags ?? [],
    idea_list:       idea.idea_list ?? [],
    recommend_score: idea.recommend_score ?? null,
  };

  try {
    const generated = await generateMvpPlan(snapshot);
    const result: MvpGenerateResult = { ...generated, idea_snapshot: snapshot };
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'MVP生成に失敗しました' },
      { status: 500 }
    );
  }
}
