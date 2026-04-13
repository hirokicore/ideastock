import type { AnalysisResult, IdeaStock } from '@/types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

async function callClaude(prompt: string, maxTokens = 2048): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY が設定されていません。Vercel の環境変数を確認してください。');
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errBody}`);
  }

  const data = await res.json() as {
    content: { type: string; text: string }[];
  };

  const text = data.content.find((c) => c.type === 'text')?.text ?? '';
  return text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
}

export async function analyzeStock(params: {
  title: string;
  source_platform: string;
  raw_text: string;
  human_note?: string;
}): Promise<AnalysisResult> {
  const prompt = `あなたは個人開発者の思考ストックを整理するAIアシスタントです。
以下の入力テキストを分析し、必ず下記のJSONフォーマットのみで返してください。

---
タイトル: ${params.title}
出所プラットフォーム: ${params.source_platform}
本文:
${params.raw_text}${params.human_note ? `\n一言メモ: ${params.human_note}` : ''}
---

【出力JSON仕様】
{
  "summary": "本文の要約（3〜5行、日本語）",
  "tags": ["関連タグ（5〜8個、日本語）"],
  "idea_list": ["本文から抽出した具体的なアイデア（3〜7個）"],
  "product_formats": ["商品化・アウトプットの形（例：note記事、PDF教材、SaaS機能追加、YouTube動画）（2〜5個）"],
  "impact_score": 1〜5の整数（1=ニッチ・小市場、5=市場規模が大きい）,
  "difficulty_score": 1〜5の整数（1=すぐできる、5=実装がかなり重い）,
  "continuity_score": 1〜5の整数（1=単発コンテンツ、5=長期の事業の柱になりうる）,
  "recommend_score": 0〜100の整数（impact・difficulty・continuityと独自性を総合評価）,
  "recommend_reason": "このストックをおすすめする具体的な理由（1〜2行）",
  "intent": "商品化" | "検討中" | "メモ" のいずれか（本文の内容・熱量・具体性から判定）,
  "related_project": "TrainerDocs" | "IdeaStock" | "その他" のいずれか（本文がパーソナルトレーナー向け書類SaaSなら「TrainerDocs」、思考整理・ストックツールなら「IdeaStock」、それ以外は「その他」）,
  "priority_category": "今すぐ" | "仕込み" | "挑戦" のいずれか（今すぐ=すぐ作ると長期メリット大・市場タイミングが重要、仕込み=条件が揃ったら一気にやる・リソース整い次第、挑戦=難易度高いが夢がある・先行投資型）,
  "time_slot": "今月" | "3ヶ月以内" | "半年〜" | "いつか" のいずれか（priority_categoryとdifficulty_scoreを総合して判定）,
  "spread_score": 1〜3の整数（1=個人・クローズド利用、2=口コミ・SNS展開可能、3=バイラル・大量拡散が狙える）,
  "cost_score": 1〜3の整数（1=低コストですぐ着手可能、2=中程度の開発コスト、3=チーム・資金が必要な高コスト）
}

JSONのみ返してください。コードブロック・説明文は不要です。`;

  const cleaned = await callClaude(prompt);

  try {
    return JSON.parse(cleaned) as AnalysisResult;
  } catch {
    throw new Error(`レスポンスを JSON としてパースできませんでした: ${cleaned.slice(0, 200)}`);
  }
}

export type Recommendation = {
  id: string;
  title: string;
  summary: string | null;
  reason: string;
};

export async function recommendStocks(
  goal: string,
  stocks: IdeaStock[]
): Promise<Recommendation[]> {
  if (stocks.length === 0) return [];

  const stockList = stocks
    .map((s, i) =>
      `${i + 1}. [ID:${s.id}] ${s.title}
   用途:${s.intent} カテゴリ:${s.priority_category ?? '未設定'} 時期:${s.time_slot ?? '未設定'} おすすめ度:${s.recommend_score ?? '?'}点
   ${s.summary ? `要約: ${s.summary.slice(0, 80)}...` : ''}`
    )
    .join('\n');

  const prompt = `あなたは個人開発者の思考ストック管理AIアシスタントです。
以下のストック一覧と「今日やりたいこと」をもとに、最も取り組むべき3件を推薦してください。

【今日やりたいこと】
${goal}

【ストック一覧】
${stockList}

【出力JSON仕様】
{
  "recommendations": [
    {
      "id": "ストックのUUID（上記リストの[ID:...]部分をそのままコピー）",
      "reason": "今日のやりたいことと照らし合わせた具体的な推薦理由（2〜3文）"
    }
  ]
}

必ず3件（ストックが3件未満の場合は全件）をJSONのみで返してください。コードブロック・説明文は不要です。`;

  const cleaned = await callClaude(prompt, 1024);

  try {
    const parsed = JSON.parse(cleaned) as { recommendations: { id: string; reason: string }[] };
    return parsed.recommendations.map((r) => {
      const stock = stocks.find((s) => s.id === r.id);
      return {
        id: r.id,
        title: stock?.title ?? '(不明)',
        summary: stock?.summary ?? null,
        reason: r.reason,
      };
    });
  } catch {
    throw new Error(`推薦レスポンスのパースに失敗しました: ${cleaned.slice(0, 200)}`);
  }
}
