import type { IdeaSnapshot, MvpGenerateResult, FullGenerateResult, RoadmapPhase, BusinessPlan } from '@/types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

async function callClaude(prompt: string, maxTokens = 2048): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY が設定されていません');

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
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json() as { content: { type: string; text: string }[] };
  const text = data.content.find((c) => c.type === 'text')?.text ?? '';
  return text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
}

export async function generateMvpPlan(idea: IdeaSnapshot): Promise<Omit<MvpGenerateResult, 'idea_snapshot'>> {
  const prompt = `あなたは個人開発者のMVP戦略AIです。
以下のアイデアを元に、最速で市場検証できるMVP事業計画を生成してください。

【アイデア情報】
タイトル: ${idea.title}
要約: ${idea.summary ?? '(なし)'}
タグ: ${idea.tags.join(', ')}
抽出アイデア: ${idea.idea_list.join(' / ')}
おすすめ度: ${idea.recommend_score ?? '?'}点

【出力JSON仕様】
{
  "title": "MVP版のタイトル（具体的・実行可能に。元タイトルを洗練させる）",
  "mvp_pain_point": "誰のどんな不満か（ターゲット像と具体的な課題を2〜3文で）",
  "mvp_core_feature": "MVPで提供する1つのコア機能（最小限かつ最大価値。1〜2文で明確に）",
  "mvp_acquisition": "初回の集客導線（具体的なチャネル・方法・想定人数を2〜3文で）",
  "mvp_monetization": "最初の収益化方法（価格帯・課金モデル・開始タイミングを2〜3文で）"
}

JSONのみ返してください。コードブロック不要。`;

  const cleaned = await callClaude(prompt, 1024);
  try {
    return JSON.parse(cleaned) as Omit<MvpGenerateResult, 'idea_snapshot'>;
  } catch {
    throw new Error(`MVP生成レスポンスのパースに失敗しました: ${cleaned.slice(0, 200)}`);
  }
}

export async function generateFullPlan(
  mvp: Pick<BusinessPlan, 'title' | 'mvp_pain_point' | 'mvp_core_feature' | 'mvp_acquisition' | 'mvp_monetization'>,
  idea: IdeaSnapshot
): Promise<FullGenerateResult> {
  const prompt = `あなたは事業計画AIです。
MVPで検証した内容を元に、本格的な事業計画を生成してください。

【MVPで検証した内容】
タイトル: ${mvp.title}
誰のどんな不満か: ${mvp.mvp_pain_point}
1コア機能: ${mvp.mvp_core_feature}
集客導線: ${mvp.mvp_acquisition}
収益化方法: ${mvp.mvp_monetization}

【元アイデア情報】
タイトル: ${idea.title}
要約: ${idea.summary ?? '(なし)'}
タグ: ${idea.tags.join(', ')}

【出力JSON仕様】
{
  "target_customer": "詳細なターゲット顧客像（ペルソナ・課題・規模感を3〜5文で）",
  "value_proposition": "提供価値（ユーザーが得られる具体的な成果・変化を3〜4文で）",
  "revenue_model": "収益モデル（価格設定・課金形態・収益拡大の道筋を3〜4文で）",
  "competitor_analysis": "競合分析（主要競合3〜5社と自社の差別化ポイントを3〜5文で）",
  "expansion_strategy": "拡張戦略（MVP後の機能拡張・市場拡大・パートナーシップ等を3〜4文で）",
  "roadmap": [
    {
      "phase": "フェーズ名（例：MVP検証期）",
      "duration": "期間（例：1〜3ヶ月）",
      "tasks": ["具体的なタスク（2〜4個）"]
    }
  ]
}

ロードマップは3〜4フェーズで。JSONのみ返してください。コードブロック不要。`;

  const cleaned = await callClaude(prompt, 2048);
  try {
    const parsed = JSON.parse(cleaned) as FullGenerateResult;
    // Validate roadmap is array
    if (!Array.isArray(parsed.roadmap)) parsed.roadmap = [] as RoadmapPhase[];
    return parsed;
  } catch {
    throw new Error(`フル版生成レスポンスのパースに失敗しました: ${cleaned.slice(0, 200)}`);
  }
}
