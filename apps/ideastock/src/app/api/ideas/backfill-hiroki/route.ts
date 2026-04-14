import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

type HirokiScores = {
  placement_score: number;
  mental_score: number;
  revenue_score: number;
};

async function scoreIdea(title: string, summary: string | null): Promise<HirokiScores> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const prompt = `以下のアイデアを3項目で採点してください。

タイトル: ${title}
要約: ${summary ?? '(なし)'}

{"placement_score":放置度1〜5,"mental_score":心理的な軽さ1〜5,"revenue_score":収益ポテンシャル1〜5}

定義: placement=作ったら自動で回る度合い(5=完全放置可), mental=着手・継続のしやすさ(5=1クリックで進む), revenue=収益化のしやすさと規模(5=大きな収益狙える)

JSONのみ返してください。`;

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);

  const data = await res.json() as { content: { type: string; text: string }[] };
  const text = (data.content.find((c) => c.type === 'text')?.text ?? '')
    .replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  return JSON.parse(text) as HirokiScores;
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY が設定されていません' }, { status: 500 });

  const { data: stocks, error } = await supabase
    .from('idea_stocks')
    .select('id, title, summary')
    .eq('user_id', user.id)
    .is('placement_score', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!stocks || stocks.length === 0) return NextResponse.json({ updated: 0 });

  let updated = 0;
  const errors: string[] = [];

  for (const stock of stocks) {
    try {
      const scores = await scoreIdea(stock.title, stock.summary);
      const { error: updateError } = await supabase
        .from('idea_stocks')
        .update({
          placement_score: scores.placement_score,
          mental_score:    scores.mental_score,
          revenue_score:   scores.revenue_score,
        })
        .eq('id', stock.id);

      if (updateError) {
        errors.push(`${stock.title}: ${updateError.message}`);
      } else {
        updated++;
      }
    } catch (err) {
      errors.push(`${stock.title}: ${err instanceof Error ? err.message : 'エラー'}`);
    }
  }

  return NextResponse.json({ updated, total: stocks.length, errors });
}
