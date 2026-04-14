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
  placement_score:  number;
  mental_score:     number;
  revenue_score:    number;
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

  const prompt = `あなたは「動けない人の静かな資産形成」を専門とするプロダクト設計AIです。
個人開発者が1人で作れる放置型プロダクトのアイデアを3案生成してください。

【生成思想：放置型で救いになりうるプロダクトの5条件】
これらの条件を全案が満たすことが絶対要件です。

1. 営業・対人コミュニケーションを前提にしないこと
   集客は検索流入・マーケットプレイス・受動的なメディア運用など静かなチャネルで成立すること。
   飛び込み・DM・商談・クライアントワークをコアに含まないこと。

2. 一度作れば"ゼロに戻らない資産"になること
   データ・ログ・テンプレ・投稿などがストックされ、しばらく何もしなくても価値が蓄積し続けること。
   使われるほど・時間が経つほど強くなる構造を持つこと。

3. 動けない時期でも参加している感覚を保てること
   アイデアを投げておくだけ・ログが貯まるだけでも「何かがたまっていく」状態を作れること。
   長期離脱しても完全にゼロリセットされない設計であること。

4. メンタル負荷の高い行動をコア要素にしないこと
   小さなステップ（1クリック・1投稿・1入力）でも前進としてカウントできる体験にすること。
   「毎日ログインしないと意味がない」「数をこなさないと成立しない」モデルは不可。

5. スパムや搾取ではなく長期的にプラスの価値を生むこと
   ニート・鬱傾向・動けない人にも「静かな貢献の仕方」を提供できる可能性があること。
   誰かを騙したり・過剰に煽ったりしない、持続可能な価値提供であること。

【ユーザーの条件】
目的: ${purpose}
希望する特性: ${conditionText}
好みのジャンル: ${genre}
${free_text ? `追加の要望: ${free_text}` : ''}

【生成ルール】
- 上記5条件をすべて満たす案のみ出力すること（1つでも欠ければ別の案に差し替える）
- 個人が3ヶ月以内に1人で作れる規模に収めること
- recommend_scoreは90点以上を目指す
- 3案はそれぞれ違うアプローチ・ジャンルにする

【出力JSON】
{
  "ideas": [
    {
      "title": "具体的なプロダクト名（20文字以内）",
      "summary": "何を作るか・誰向けか・なぜ放置できるかを含む概要（150文字以内）",
      "passivity_reason": "なぜ放置できるのか・上記5条件のどれを満たすかを具体的に説明（100文字以内）",
      "impact_score": 1〜5の整数,
      "difficulty_score": 1〜5の整数（低いほど簡単）,
      "continuity_score": 1〜5の整数,
      "recommend_score": 0〜100の整数（90以上を目指す）,
      "placement_score": 1〜5の整数（放置度：作ったら自動で回る度合い、1=常時対応必須、5=完全放置可能）,
      "mental_score": 1〜5の整数（心理的な軽さ：着手・継続のしやすさ、1=ハードルが高い、5=1クリックで進められる）,
      "revenue_score": 1〜5の整数（収益ポテンシャル：収益化のしやすさと規模、1=収益化が難しい、5=大きな収益が狙える）
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
