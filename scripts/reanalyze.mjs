/**
 * 全ストック再分析スクリプト
 *
 * 実行前に .env.local に以下を追加してください:
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...   ← Supabase Dashboard > Settings > API > service_role
 *
 * 実行方法:
 *   node scripts/reanalyze.mjs
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── .env.local を読み込む ──────────────────────────────────────────
const envPath = resolve(process.cwd(), '.env.local');
const env = {};
try {
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
} catch {
  console.error('.env.local が見つかりません');
  process.exit(1);
}

const SUPABASE_URL      = env['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_ROLE_KEY  = env['SUPABASE_SERVICE_ROLE_KEY'];
const ANTHROPIC_API_KEY = env['ANTHROPIC_API_KEY'];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL または SUPABASE_SERVICE_ROLE_KEY が未設定です。');
  console.error('Supabase Dashboard > Settings > API から service_role キーを取得して .env.local に追加してください。');
  process.exit(1);
}
if (!ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY が未設定です。');
  process.exit(1);
}

// ── Supabase REST API ──────────────────────────────────────────────
async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase error ${res.status}: ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Anthropic API ──────────────────────────────────────────────────
async function analyzeStock(stock) {
  const prompt = `あなたは個人開発者の思考ストックを整理するAIアシスタントです。
以下の入力テキストを分析し、必ず下記のJSONフォーマットのみで返してください。

---
タイトル: ${stock.title}
出所プラットフォーム: ${stock.source_platform}
本文:
${stock.raw_text}${stock.human_note ? `\n一言メモ: ${stock.human_note}` : ''}
---

【出力JSON仕様】
{
  "summary": "本文の要約（3〜5行、日本語）",
  "tags": ["関連タグ（5〜8個、日本語）"],
  "idea_list": ["本文から抽出した具体的なアイデア（3〜7個）"],
  "product_formats": ["商品化・アウトプットの形（2〜5個）"],
  "impact_score": 1〜5の整数,
  "difficulty_score": 1〜5の整数,
  "continuity_score": 1〜5の整数,
  "recommend_score": 0〜100の整数,
  "recommend_reason": "おすすめ理由（1〜2行）",
  "intent": "商品化" | "検討中" | "メモ",
  "related_project": "TrainerDocs" | "IdeaStock" | "その他",
  "priority_category": "今すぐ" | "仕込み" | "挑戦",
  "time_slot": "今月" | "3ヶ月以内" | "半年〜" | "いつか",
  "spread_score": 1〜3の整数（1=個人・クローズド、2=SNS展開可、3=バイラル狙える）,
  "cost_score": 1〜3の整数（1=低コスト、2=中程度、3=高コスト）
}

JSONのみ返してください。コードブロック・説明文は不要です。`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
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

  const data = await res.json();
  const text = (data.content.find((c) => c.type === 'text')?.text ?? '')
    .replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  return JSON.parse(text);
}

// ── メイン処理 ──────────────────────────────────────────────────────
async function main() {
  console.log('全ストック再分析を開始します...\n');

  const stocks = await supabaseFetch('/idea_stocks?select=id,title,source_platform,raw_text,human_note');
  console.log(`対象: ${stocks.length} 件\n`);

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];
    process.stdout.write(`[${i + 1}/${stocks.length}] ${stock.title.slice(0, 40)}... `);

    try {
      const analysis = await analyzeStock(stock);

      await supabaseFetch(`/idea_stocks?id=eq.${stock.id}`, {
        method: 'PATCH',
        body: JSON.stringify(analysis),
      });

      console.log('✓');
      succeeded++;
    } catch (err) {
      console.log(`✗ ${err.message}`);
      failed++;
    }

    // Rate limiting
    if (i < stocks.length - 1) {
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  console.log(`\n完了: 成功 ${succeeded}件 / 失敗 ${failed}件`);
}

main().catch((err) => {
  console.error('スクリプトエラー:', err.message);
  process.exit(1);
});
