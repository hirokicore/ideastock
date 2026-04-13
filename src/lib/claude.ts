import type { AnalysisResult, IdeaStock, RefineResult, Variation } from '@/types';

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

export async function refineStock(stock: IdeaStock): Promise<RefineResult> {
  const prompt = `あなたは個人開発者のアイデア精査AIです。
以下のアイデアを「市場性・実現性・継続性」の3軸で徹底分析し、スコア90点以上を目指した改善版を生成してください。

【現在のアイデア】
タイトル: ${stock.title}
要約: ${stock.summary ?? '(なし)'}
現スコア: インパクト${stock.impact_score ?? '?'}/5 難易度${stock.difficulty_score ?? '?'}/5 継続性${stock.continuity_score ?? '?'}/5 総合${stock.recommend_score ?? '?'}点
タグ: ${stock.tags?.join(', ') ?? ''}
抽出アイデア: ${stock.idea_list?.join(' / ') ?? ''}
商品化の形: ${stock.product_formats?.join(' / ') ?? ''}
${stock.human_note ? `一言メモ: ${stock.human_note}` : ''}

本文（先頭3000文字）:
${stock.raw_text.slice(0, 3000)}

【改善方針】
- 市場性（impact）が低い → ターゲット拡大・市場タイミング・差別化ポイントを強化
- 難易度（difficulty）が高い → MVP化・スモールスタート・フェーズ分割を提案
- 継続性（continuity）が低い → サブスク化・コミュニティ・横展開の可能性を探る
- 総合スコアが90点未満 → 独自性・競合優位性・マネタイズ経路を明確化

【出力JSON仕様】
{
  "new_title": "改善版タイトル（元より具体的・魅力的に）",
  "improved_summary": "改善後のアイデア要約（500文字以内）",
  "market_improvement": "市場性の弱点と具体的な強化案（200文字以内）",
  "feasibility_improvement": "実現性の弱点とMVP戦略（200文字以内）",
  "continuity_improvement": "継続性の弱点とビジネスモデル改善案（200文字以内）",
  "key_changes": ["元アイデアからの主要な変更点・追加要素（3〜5個）"],
  "summary": "improved_summaryと同じ内容",
  "tags": ["改善版のタグ（5〜8個）"],
  "idea_list": ["改善版の具体的アイデア（3〜7個）"],
  "product_formats": ["改善版の商品化の形（2〜5個）"],
  "impact_score": 改善後のインパクト（1〜5の整数）,
  "difficulty_score": 改善後の難易度（1〜5の整数）,
  "continuity_score": 改善後の継続性（1〜5の整数）,
  "recommend_score": 改善後の総合スコア（90以上を目指す、0〜100の整数）,
  "recommend_reason": "改善版のおすすめ理由（1〜2行）",
  "intent": "商品化",
  "related_project": "IdeaStock",
  "priority_category": "今すぐ" | "仕込み" | "挑戦" のいずれか,
  "time_slot": "今月" | "3ヶ月以内" | "半年〜" | "いつか" のいずれか,
  "spread_score": 改善後の拡散性（1〜3の整数）,
  "cost_score": 改善後の実装コスト（1〜3の整数）
}

JSONのみ返してください。コードブロック・説明文は不要です。`;

  const cleaned = await callClaude(prompt, 3000);

  try {
    return JSON.parse(cleaned) as RefineResult;
  } catch {
    throw new Error(`改善レスポンスのパースに失敗しました: ${cleaned.slice(0, 200)}`);
  }
}

export async function extractVariation(
  existing: { title: string; summary: string | null },
  newIdea: { title: string; summary: string; idea_list: string[] }
): Promise<{ diff_points: string[]; shared_core: string }> {
  const prompt = `あなたはアイデア比較AIです。
「既存アイデア」と「新規アイデア」を比較し、共通部分と差分を抽出してください。

【既存アイデア】
タイトル: ${existing.title}
要約: ${existing.summary ?? '(なし)'}

【新規アイデア】
タイトル: ${newIdea.title}
要約: ${newIdea.summary}
抽出アイデア: ${newIdea.idea_list.join(' / ')}

【出力JSON仕様】
{
  "shared_core": "両者に共通する本質的なコア（1〜2文）",
  "diff_points": ["新規アイデア固有の差分・追加要素（2〜4個、日本語）"]
}

JSONのみ返してください。コードブロック不要。`;

  const cleaned = await callClaude(prompt, 512);

  try {
    return JSON.parse(cleaned) as { diff_points: string[]; shared_core: string };
  } catch {
    return {
      shared_core: '共通のコアアイデア',
      diff_points: [newIdea.title],
    };
  }
}

export async function detectSimilarStocks(
  newIdea: { title: string; summary: string; tags: string[] },
  existingStocks: { id: string; title: string; summary: string | null; tags: string[] }[]
): Promise<{ candidates: { id: string; similarity_type: 'duplicate' | 'related'; reason: string }[] }> {
  if (existingStocks.length === 0) return { candidates: [] };

  // Use numeric indices in prompt to avoid UUID hallucination
  const stockList = existingStocks
    .map((s, i) =>
      `[${i + 1}] ${s.title}
   タグ: ${s.tags?.join(', ') ?? ''}
   ${s.summary ? `要約: ${s.summary.slice(0, 120)}` : ''}`
    )
    .join('\n\n');

  const prompt = `あなたはアイデア重複・関連性判定AIです。
新規アイデアと既存ストックを比較し、類似または関連するものを検出してください。

【新規アイデア】
タイトル: ${newIdea.title}
タグ: ${newIdea.tags.join(', ')}
要約: ${newIdea.summary}

【既存ストック一覧】
${stockList}

【判定基準】
- duplicate（統合候補）: タイトル・テーマ・解決したい課題が同じ、またはほぼ同じと判断できるもの。
  例: 「匿名アイデアボックス」と「社内匿名意見箱SaaS」は duplicate。
- related（関連候補）: テーマや技術が重なり、合わせて見ると相乗効果があるもの。

判定はかなり積極的に行ってください。タイトルや要約の表現が違っても、同じ問題を解こうとしているなら duplicate にしてください。

【出力JSON仕様】
{
  "candidates": [
    {
      "index": 既存ストックの番号（整数）,
      "similarity_type": "duplicate" または "related",
      "reason": "類似・関連と判断した理由（1〜2文、日本語）"
    }
  ]
}

類似・関連するものがない場合のみ candidates を空配列にしてください。
最大3件まで。JSONのみ返してください。コードブロック不要。`;

  const cleaned = await callClaude(prompt, 1024);

  try {
    const parsed = JSON.parse(cleaned) as {
      candidates: { index: number; similarity_type: 'duplicate' | 'related'; reason: string }[];
    };

    // Map numeric indices back to UUIDs
    const result = parsed.candidates
      .map((c) => {
        const stock = existingStocks[c.index - 1];
        if (!stock) return null;
        return { id: stock.id, similarity_type: c.similarity_type, reason: c.reason };
      })
      .filter((c): c is { id: string; similarity_type: 'duplicate' | 'related'; reason: string } => c !== null);

    return { candidates: result };
  } catch {
    return { candidates: [] };
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
