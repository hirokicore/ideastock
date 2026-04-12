import Anthropic from '@anthropic-ai/sdk';
import type { AnalysisResult } from '@/types';

export async function analyzeStock(params: {
  title: string;
  source_platform: string;
  raw_text: string;
  human_note?: string;
  intent: string;
}): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY が設定されていません。Vercel の環境変数を確認してください。');
  }

  const client = new Anthropic({
    apiKey,
    timeout: 50_000, // Vercel Hobby の最大実行時間 60s に余裕を持たせた 50s
    maxRetries: 0,
  });

  const prompt = `あなたは個人開発者の思考ストックを整理するAIアシスタントです。
以下の入力テキストを分析し、必ず下記のJSONフォーマットのみで返してください。

---
タイトル: ${params.title}
出所プラットフォーム: ${params.source_platform}
用途の意図: ${params.intent}
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
  "recommend_score": 0〜100の整数（impact・difficulty・continuityと意図・独自性を総合評価）,
  "recommend_reason": "このストックをおすすめする具体的な理由（1〜2行）"
}

JSONのみ返してください。コードブロック・説明文は不要です。`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    return JSON.parse(cleaned) as AnalysisResult;
  } catch {
    throw new Error(`Claude の応答を JSON としてパースできませんでした: ${cleaned.slice(0, 200)}`);
  }
}
