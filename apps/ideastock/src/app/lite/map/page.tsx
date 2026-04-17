import { Copy } from 'lucide-react';

type ProcessRow = {
  process: string;
  current: string;
  who: '人間' | '外部AI' | '人間+AI' | 'サイト';
  tool: string;
  input: string;
  output: string;
  destination: string;
};

const ROWS: ProcessRow[] = [
  {
    process: 'タイトル生成',
    current: 'Claude 自動',
    who: '人間',
    tool: '自分',
    input: 'raw_text',
    output: 'title（1行）',
    destination: '/lite/new ① タイトル欄',
  },
  {
    process: '要約',
    current: 'Claude 自動',
    who: '外部AI',
    tool: 'ChatGPT / Claude',
    input: 'raw_text',
    output: 'summary（2〜3文）',
    destination: '/lite/new ② 要約欄',
  },
  {
    process: 'タグ抽出',
    current: 'Claude 自動',
    who: '外部AI',
    tool: 'ChatGPT / Claude',
    input: 'raw_text',
    output: 'tags[]（5〜8個）',
    destination: '/lite/new ② タグ欄',
  },
  {
    process: 'アイデア展開',
    current: 'Claude 自動',
    who: '外部AI',
    tool: 'Claude / ChatGPT',
    input: 'title + summary',
    output: 'idea_list[]（3〜5案）',
    destination: '/lite/new ② アイデア展開欄',
  },
  {
    process: '商品形式の特定',
    current: 'Claude 自動',
    who: '人間+AI',
    tool: 'Claude（プロンプト提供）',
    input: 'summary + idea_list',
    output: 'product_formats[]',
    destination: '（現在Lite未実装 → rebuild で補完）',
  },
  {
    process: 'スコアリング',
    current: 'Claude 自動（全6軸）',
    who: '人間+AI',
    tool: 'Claude / ChatGPT + 人間判断',
    input: 'title + summary',
    output: '各スコア 1〜5',
    destination: '/lite/new ③ スコア欄',
  },
  {
    process: '用途・優先度判定',
    current: 'Claude 自動',
    who: '人間',
    tool: '自分',
    input: '内容を読んで判断',
    output: 'intent / priority_category / time_slot',
    destination: '/lite/new ② 用途・優先度セレクト',
  },
  {
    process: '類似検索',
    current: 'Claude 自動（50件比較）',
    who: '人間',
    tool: '自分（/lite/stocks を見ながら）',
    input: '既存一覧',
    output: 'related_ids[]',
    destination: '/stocks/[id] 関連ストック PATCH',
  },
  {
    process: 'アイデア改善（refine）',
    current: 'Claude 自動（max_tokens 3000）',
    who: '外部AI',
    tool: 'Claude（プロンプト手動実行）',
    input: 'stock全体のテキスト',
    output: '改善後スコア + 差分説明',
    destination: '/lite/rebuild → 個別フィールド更新',
  },
  {
    process: '推薦提案',
    current: 'Claude 自動（全ストック対象）',
    who: '人間',
    tool: '自分（/lite/stocks のフィルタで代替）',
    input: 'goal + 全ストック',
    output: '推薦3件',
    destination: '（Liteでは手動フィルタで代替）',
  },
];

const WHO_STYLE: Record<string, string> = {
  '人間':     'bg-blue-100 text-blue-700',
  '外部AI':   'bg-yellow-100 text-yellow-700',
  '人間+AI':  'bg-purple-100 text-purple-700',
  'サイト':   'bg-green-100 text-green-700',
};

const PROMPTS: { label: string; body: string }[] = [
  {
    label: '要約 + タグ生成',
    body: `以下のテキストから、次の2つを出力してください。

【要約】2〜3文で本質を圧縮してください。
【タグ】関連キーワードを5〜8個、カンマ区切りで列挙してください。

---
{raw_text を貼り付け}
---`,
  },
  {
    label: 'アイデア展開',
    body: `以下のアイデアから派生する具体的な展開・活用方法を3〜5個、箇条書きで列挙してください。

タイトル：{title}
要約：{summary}`,
  },
  {
    label: 'スコアリング',
    body: `以下のアイデアを1〜5のスコアで評価し、「スコア名: 数値 // 理由」の形式で出力してください。

- impact_score　　: 市場規模・影響の大きさ（5が最大）
- difficulty_score: 実現難易度（5が最難）
- continuity_score: 事業継続性（5が高い）
- placement_score : 放置型度（5が最も放置型）
- mental_score　　: 心理的軽さ（5が最もラク）
- revenue_score　　: 収益ポテンシャル（5が最大）

アイデア：{title}
要約：{summary}`,
  },
  {
    label: '既存ストック改善（refine代替）',
    body: `以下のアイデアについて、改善提案を行ってください。

1. タイトルをより魅力的に改善（1案）
2. 要約を2〜3文で改善
3. 市場性・実現性・継続性それぞれの改善ポイントを1〜2文ずつ
4. スコアを再評価（1〜5）

---
タイトル：{title}
要約：{summary}
現在のスコア：影響{impact} / 難易{difficulty} / 継続{continuity}
---`,
  },
];

export default function LiteMapPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">処理マップ</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          通常版 ideastock でClaudeが自動処理していた内容を、Liteワークフローでどう分担するかの対応表です。
          「誰が・何ツールで・どこに入力するか」を参照してください。
        </p>
      </div>

      {/* Main table */}
      <section>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">処理分担表</h2>
        <div className="rounded-xl border overflow-x-auto" style={{ borderColor: '#3a3660' }}>
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr style={{ backgroundColor: '#2e2b50' }}>
                {['処理', '通常版', 'Lite担当', 'ツール', '入力', '出力', '入力先'].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 text-gray-400 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#3a3660' }}>
              {ROWS.map((row) => (
                <tr key={row.process} className="transition-colors hover:bg-brand-50">
                  <td className="px-3 py-2.5 font-medium text-gray-700 whitespace-nowrap">{row.process}</td>
                  <td className="px-3 py-2.5 text-gray-400">{row.current}</td>
                  <td className="px-3 py-2.5">
                    <span className={`badge text-[10px] ${WHO_STYLE[row.who]}`}>{row.who}</span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500">{row.tool}</td>
                  <td className="px-3 py-2.5 text-gray-400 font-mono text-[11px]">{row.input}</td>
                  <td className="px-3 py-2.5 text-gray-400 font-mono text-[11px]">{row.output}</td>
                  <td className="px-3 py-2.5 text-brand-600 text-[11px]">{row.destination}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Legend */}
      <section>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">担当凡例</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(WHO_STYLE).map(([k, v]) => (
            <span key={k} className={`badge text-xs px-3 py-1.5 ${v}`}>{k}</span>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          「外部AI」は自分がChatGPT/Claudeのウェブ版にプロンプトを貼って実行し、結果をLiteフォームに転記する方式です。
        </p>
      </section>

      {/* Prompt library */}
      <section>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">プロンプトライブラリ</h2>
        <p className="text-xs text-gray-500 mb-4">
          これらのプロンプトは `/lite/new` ページにも表示されます。ここではリファレンスとして参照してください。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROMPTS.map(({ label, body }) => (
            <div key={label} className="rounded-xl border p-4" style={{ backgroundColor: '#252240', borderColor: '#3a3660' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-brand-600">{label}</span>
                <Copy size={12} className="text-gray-400" />
              </div>
              <pre className="text-xs whitespace-pre-wrap leading-relaxed text-gray-500" style={{ maxHeight: 160, overflow: 'auto' }}>
                {body}
              </pre>
            </div>
          ))}
        </div>
      </section>

      {/* n8n note */}
      <section className="rounded-xl border p-5" style={{ backgroundColor: '#252240', borderColor: '#3a3660' }}>
        <h2 className="text-sm font-bold text-gray-700 mb-2">将来の自動化・n8n連携に向けて</h2>
        <ul className="text-xs text-gray-500 space-y-1.5 leading-relaxed list-disc list-inside">
          <li>各処理の「入力」「出力」「入力先フォーム欄」の境界が明確なので、n8nのノードとして1:1でマッピング可能</li>
          <li>ステータス管理（localStorage）は将来 Supabase カラムに移行することで n8n トリガーに使える</li>
          <li>プロンプトをDBに保存することで、「プロンプト差し替え」だけでAI担当を変更できる構造になる</li>
          <li>「外部AI処理待ち」ステータスを Webhook トリガーにすれば、n8n → AI → 自動転記のフローが組める</li>
        </ul>
      </section>
    </div>
  );
}
