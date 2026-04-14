import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { GeneratedIdea } from '@/app/api/ideas/generate/route';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { ideas } = await request.json() as { ideas: GeneratedIdea[] };
  if (!Array.isArray(ideas) || ideas.length === 0) {
    return NextResponse.json({ error: 'ideas が必要です' }, { status: 400 });
  }

  const rows = ideas.map((idea) => ({
    user_id:          user.id,
    title:            idea.title,
    source_platform:  'Claude',
    raw_text:         `${idea.summary}\n\n放置できる理由: ${idea.passivity_reason}`,
    intent:           '商品化',
    related_project:  'その他',
    summary:          idea.summary,
    tags:             [],
    idea_list:        [idea.passivity_reason],
    product_formats:  [],
    impact_score:     idea.impact_score,
    difficulty_score: idea.difficulty_score,
    continuity_score: idea.continuity_score,
    recommend_score:  idea.recommend_score,
    recommend_reason: idea.passivity_reason,
    priority_category: '今すぐ',
    time_slot:        '今月',
    spread_score:     2,
    cost_score:       1,
    operation_type:   '放置型',
  }));

  const { error } = await supabase.from('idea_stocks').insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ count: rows.length });
}
