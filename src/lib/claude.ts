import type { AnalysisResult } from '@/types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export async function analyzeStock(params: {
  title: string;
  source_platform: string;
  raw_text: string;
  human_note?: string;
}): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY が設定されていません。Vercel の環境変数を確認してください。');
  }

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
  "intent": "商品化" | "検討中" | "メモ" のいずれか（本文の内容・熱量・具体性から判定。すぐ製品化できそうなら「商品化」、面白いが検討が必要なら「検討中」、記録・参考程度なら「メモ」）,
  "related_project": "TrainerDocs" | "IdeaStock" | "その他" のいずれか（本文がパーソナルトレーナー向け書類SaaSに関連するなら「TrainerDocs」、思考整理・ストックツールに関連するなら「IdeaStock」、それ以外は「その他」）
}

JSONのみ返してください。コードブロック・説明文は不要です。`;

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
    const errBody = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errBody}`);
  }

  const data = await res.json() as {
    content: { type: string; text: string }[];
  };

  const text = data.content.find((c) => c.type === 'text')?.text ?? '';
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    return JSON.parse(cleaned) as AnalysisResult;
  } catch {
    throw new Error(`レスポンスを JSON としてパースできませんでした: ${cleaned.slice(0, 200)}`);
  }
}
