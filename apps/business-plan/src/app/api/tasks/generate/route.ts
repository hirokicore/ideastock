import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { BusinessPlan } from '@/types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

type TaskItem = { title: string; description: string; time_slot: '今日' | '今週' };

async function generateTasks(plan: BusinessPlan): Promise<TaskItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY が設定されていません');

  const prompt = `あなたは個人開発者の実行支援AIです。
以下のMVP事業計画を元に、「まず動くものを作って反応を見る」レベルに絞った実行タスクを最大5件生成してください。

【MVP事業計画】
タイトル: ${plan.title}
誰のどんな不満: ${plan.mvp_pain_point}
1コア機能: ${plan.mvp_core_feature}
集客導線: ${plan.mvp_acquisition}
収益化方法: ${plan.mvp_monetization}

【生成ルール】
- 1週間以内に1人で完了できるタスクのみ
- 「動くものを作って反応を見る」ことだけにフォーカス
- 拡張・スケール・収益多層化・競合分析などは含めない
- 今日タスクを最低2件含める
- time_slotは「今日」か「今週」のみ使用（「今月」「いつか」は絶対に使わない）
- タスク数は5件以内

【出力JSON】
[
  {
    "title": "タスク名（動詞で始まる簡潔な表現）",
    "description": "具体的に何をするか（ツール・方法・成果物まで明記。2〜3文）",
    "time_slot": "今日|今週"
  }
]

JSONのみ返してください。コードブロック不要。`;

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json() as { content: { type: string; text: string }[] };
  const text = (data.content.find((c) => c.type === 'text')?.text ?? '')
    .replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  const parsed = JSON.parse(text) as TaskItem[];
  if (!Array.isArray(parsed)) throw new Error('生成結果がJSON配列ではありません');
  return parsed;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { plan_id } = await request.json() as { plan_id: string };
  if (!plan_id) return NextResponse.json({ error: 'plan_id が必要です' }, { status: 400 });

  const { data: plan, error: planError } = await supabase
    .from('business_plans')
    .select('*')
    .eq('id', plan_id)
    .eq('user_id', user.id)
    .single();

  if (planError || !plan) return NextResponse.json({ error: '事業計画が見つかりません' }, { status: 404 });

  const bp = plan as BusinessPlan;

  try {
    const tasks = await generateTasks(bp);

    const rows = tasks.map((t) => ({
      user_id:        user.id,
      source_plan_id: bp.id,
      source_idea_id: bp.source_idea_id ?? null,
      title:          t.title,
      description:    t.description,
      time_slot:      t.time_slot,
      status:         'todo',
      result:         '',
      learning:       '',
    }));

    const { error: insertError } = await supabase
      .from('execution_tasks')
      .insert(rows);

    if (insertError) throw new Error(insertError.message);

    return NextResponse.json({ count: rows.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'タスク生成に失敗しました' },
      { status: 500 }
    );
  }
}
