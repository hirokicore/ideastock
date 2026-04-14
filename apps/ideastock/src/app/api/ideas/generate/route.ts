import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export type GeneratedIdea = {
  title:            string;
  summary:          string;
  passivity_reason: string;
  impact_score:     number;
  difficulty_score: number;
  continuity_score: number;
  recommend_score:  number;
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { purpose, conditions, genre, free_text } = await request.json() as {
    purpose:    string;
    conditions: string[];
    genre:      string;
    free_text?: string;
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY が設定されていません' }, { status: 500 });

  const conditionText = conditions.length > 0 ? conditions.join('、') : 'なし';

  const prompt = `あなたは放置型ビジネスの専門家AIです。
個人開発者が1人で作れる「放置型・自動収益化」のアイデアを3案生成してください。

【ユーザーの条件】
目的: ${purpose}
希望する特性: ${conditionText}
好みのジャンル: ${genre}
${free_text ? `追加の要望: ${free_text}` : ''}

【生成ルール】
- 「作ったら勝手に回る」放置型に特化すること
- 継続的な営業・クライアント対応が不要なモデル
- 個人が3ヶ月以内に一人で作れる規模
- recommend_scoreは90点以上を目指す
- 3案はそれぞれ違うアプローチ・ジャンルにする

【出力JSON】
{
  "ideas": [
    {
      "title": "具体的なプロダクト名（20文字以内）",
      "summary": "何を作るか・誰向けか・なぜ放置できるかを含む概要（150文字以内）",
      "passivity_reason": "なぜ放置できるのか・自動化の仕組みを具体的に説明（80文字以内）",
      "impact_score": 1〜5の整数,
      "difficulty_score": 1〜5の整数（低いほど簡単）,
      "continuity_score": 1〜5の整数,
      "recommend_score": 0〜100の整数（90以上を目指す）
    }
  ]
}

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
    return NextResponse.json({ error: `Anthropic API error ${res.status}: ${err}` }, { status: 500 });
  }

  const data = await res.json() as { content: { type: string; text: string }[] };
  const text = (data.content.find((c) => c.type === 'text')?.text ?? '')
    .replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    const parsed = JSON.parse(text) as { ideas: GeneratedIdea[] };
    return NextResponse.json({ ideas: parsed.ideas });
  } catch {
    return NextResponse.json({ error: `パースに失敗しました: ${text.slice(0, 200)}` }, { status: 500 });
  }
}
