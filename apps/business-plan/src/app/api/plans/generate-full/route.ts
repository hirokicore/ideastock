import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateFullPlan } from '@/lib/claude';
import type { BusinessPlan } from '@/types';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { plan_id } = await request.json() as { plan_id: string };
  if (!plan_id) {
    return NextResponse.json({ error: 'plan_id が必要です' }, { status: 400 });
  }

  const { data: plan, error } = await supabase
    .from('business_plans')
    .select('*')
    .eq('id', plan_id)
    .eq('user_id', user.id)
    .single();

  if (error || !plan) {
    return NextResponse.json({ error: '事業計画が見つかりません' }, { status: 404 });
  }

  const bp = plan as BusinessPlan;

  try {
    const result = await generateFullPlan(
      {
        title:            bp.title,
        mvp_pain_point:   bp.mvp_pain_point,
        mvp_core_feature: bp.mvp_core_feature,
        mvp_acquisition:  bp.mvp_acquisition,
        mvp_monetization: bp.mvp_monetization,
      },
      bp.idea_snapshot ?? {
        id: '',
        title: bp.title,
        summary: null,
        tags: [],
        idea_list: [],
        recommend_score: null,
      }
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'フル版生成に失敗しました' },
      { status: 500 }
    );
  }
}
