import { Copy } from 'lucide-react';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
type Who = '人間+AI' | '外部AI' | '人間確定' | 'Claude Code';

type ProcessRow = {
  process: string;
  current: string;
  who: Who;
  primary: string;
  alt: string;
  humanRole: string;  // 「AIが案を出し、人間が決める」流れでの関与タイミング
  destination: string;
};

// ──────────────────────────────────────────────
// AI担当ロール定義
// ──────────────────────────────────────────────
//  ChatGPT   → 設計・構成・整理・ロードマップ・軽量チャット全般
//  Gemini    → 長文出力・大量生成・一括ドラフト
//  Perplexity→ 調査・比較・裏取り・市場データ・エラー調査
//  Claude Code → 実装・コード修正・配置・コミット（実装専任）
//  自分      → 最終決定（AIの案を採用・微修正・却下する役割）
// ──────────────────────────────────────────────

const ROWS: ProcessRow[] = [
  {
    process: 'タイトル生成',
    current: 'Claude 自動',
    who: '人間+AI',
    primary: 'ChatGPT',
    alt: '汎用AI（任意）',
    humanRole: 'AI案を3つ程度もらい、採用・修正・却下を決める',
    destination: '/lite/new ① タイトル欄',
  },
  {
    process: '要約',
    current: 'Claude 自動',
    who: '外部AI',
    primary: 'ChatGPT',
    alt: 'Gemini',
    humanRole: 'AI出力を確認し、不要部分を削除・微修正して転記',
    destination: '/lite/new ② 要約欄',
  },
  {
    process: 'タグ抽出',
    current: 'Claude 自動',
    who: '外部AI',
    primary: 'ChatGPT',
    alt: '汎用AI（任意）',
    humanRole: 'AI案から過不足を確認・修正して確定',
    destination: '/lite/new ② タグ欄',
  },
  {
    process: 'アイデア展開',
    current: 'Claude 自動',
    who: '外部AI',
    primary: 'ChatGPT',
    alt: 'Gemini（展開案を多く出したい場合）',
    humanRole: 'AI案から使えるものを選んで転記。選ばなかった案は捨てる',
    destination: '/lite/new ② アイデア展開欄',
  },
  {
    process: '商品形式の特定',
    current: 'Claude 自動',
    who: '人間+AI',
    primary: 'ChatGPT',
    alt: 'Gemini',
    humanRole: 'AI提案（SaaS/動画/テンプレ等）から現実的なものを選択',
    destination: '（Lite未実装 → rebuild で補完）',
  },
  {
    process: 'スコアリング（初回）',
    current: 'Claude 自動（全6軸）',
    who: '人間+AI',
    primary: 'ChatGPT',
    alt: 'Perplexity（市場規模・需要を裏取りしたい場合）',
    humanRole: 'AIのスコア根拠を読んで、採用・微修正・却下を入力欄に反映',
    destination: '/lite/new ③ スコア欄',
  },
  {
    process: '用途・優先度判定',
    current: 'Claude 自動',
    who: '人間+AI',
    primary: 'ChatGPT',
    alt: '汎用AI（任意）',
    humanRole: 'AI提案（intent / priority / time_slot）を参考に最終分類を自分で決定',
    destination: '/lite/new ② 用途・優先度セレクト',
  },
  {
    process: '類似検索',
    current: 'Claude 自動（50件比較）',
    who: '人間+AI',
    primary: 'Perplexity',
    alt: '自分（/lite/stocks 一覧から目視）',
    humanRole: '調査結果を見て関連ストックを判断・related_ids に手動設定',
    destination: '/stocks/[id] 関連ストック PATCH',
  },
  {
    process: 'スコア改善（→90点以上）',
    current: 'Claude 自動（refine）',
    who: '人間+AI',
    primary: 'ChatGPT',
    alt: 'Gemini（改善案を大量に出したい場合）',
    humanRole: 'AI改善案と理由を読み、採用する変更点を決めて転記',
    destination: '/lite/rebuild → 個別フィールド更新',
  },
  {
    process: 'スコアが出にくい場合の診断',
    current: 'Claude 自動（暗黙）',
    who: '人間+AI',
    primary: 'ChatGPT',
    alt: 'Perplexity（市場の実態確認）',
    humanRole: 'AI診断（なぜ低いか・何を変えると上がるか・その理由）を読んで方向性を決める',
    destination: '/lite/rebuild → 方針変更後に再スコア',
  },
  {
    process: '推薦提案（今日やること選定）',
    current: 'Claude 自動（全ストック対象）',
    who: '人間+AI',
    primary: '自分（/lite/stocks フィルタ）',
    alt: 'Perplexity（市場トレンド調査で優先度補正）',
    humanRole: 'フィルタ結果を見て「今日取り組むアイデア」を最終決定',
    destination: '（Liteでは手動フィルタで代替）',
  },
  {
    process: '実装・コード修正・配置',
    current: '（ideastockには不要）',
    who: 'Claude Code',
    primary: 'Claude Code',
    alt: 'なし（実装はClaude Code専任）',
    humanRole: '実装方針・ファイル指定・レビューを判断する',
    destination: '（アプリ実装フロー）',
  },
];

// ──────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────
const WHO_STYLE: Record<Who, string> = {
  '人間+AI':     'bg-purple-100 text-purple-700',
  '外部AI':      'bg-yellow-100 text-yellow-700',
  '人間確定':    'bg-blue-100 text-blue-700',
  'Claude Code': 'bg-indigo-50 text-indigo-700',
};

// ──────────────────────────────────────────────
// AI担当の役割早見表
// ──────────────────────────────────────────────
const AI_ROLES = [
  { name: 'ChatGPT',     color: 'bg-green-100 text-green-700',  desc: '設計・構成・整理・ロードマップ・スコア提案・軽量チャット全般' },
  { name: 'Gemini',      color: 'bg-blue-100 text-blue-700',    desc: '長文出力・大量生成・一括ドラフト・展開案を多く出したい場合' },
  { name: 'Perplexity',  color: 'bg-yellow-100 text-yellow-700', desc: '調査・比較・裏取り・市場規模確認・エラー調査・類似サービス調査' },
  { name: 'Claude Code', color: 'bg-indigo-50 text-indigo-700',  desc: '実装・コード修正・ファイル配置・コミット（チャット用途には使わない）' },
  { name: '自分',        color: 'bg-purple-100 text-purple-700', desc: '最終決定。AI案を採用・微修正・却下する。ゼロから考えるのではなく、AI案を判断する役割' },
];

// ──────────────────────────────────────────────
// Prompts
// ──────────────────────────────────────────────
const PROMPTS: { label: string; tool: string; body: string }[] = [
  {
    label: 'タイトル候補の生成',
    tool: 'ChatGPT',
    body: `以下のテキストを読んで、魅力的なアイデアタイトルの候補を3案出してください。
各案に「なぜこのタイトルにしたか」を1行で添えてください。

---
{raw_text を貼り付け}
---`,
  },
  {
    label: '要約 + タグ生成',
    tool: 'ChatGPT',
    body: `以下のテキストから、次の2つを出力してください。

【要約】2〜3文で本質を圧縮してください。
【タグ】関連キーワードを5〜8個、カンマ区切りで列挙してください。

---
{raw_text を貼り付け}
---`,
  },
  {
    label: 'アイデア展開',
    tool: 'ChatGPT / Gemini',
    body: `以下のアイデアから派生する具体的な展開・活用方法を3〜5個、箇条書きで列挙してください。
各案に実現可能性と根拠を1行で添えてください。

タイトル：{title}
要約：{summary}`,
  },
  {
    label: 'スコアリング（根拠付き）',
    tool: 'ChatGPT',
    body: `以下のアイデアを1〜5のスコアで評価し、「スコア名: 数値 // 根拠（1文）」の形式で出力してください。

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
    label: 'スコア改善（→90点以上へ）',
    tool: 'ChatGPT',
    body: `以下のアイデアについて、スコアを90点以上に引き上げるための改善提案を行ってください。

出力形式：
1. 現状の弱点（どのスコアがなぜ低いか）
2. 改善案（タイトル・方向性・ターゲットなどの変更案）
3. 改善後の予測スコア（各軸）
4. なぜその変更で改善するか（理由）

---
タイトル：{title}
要約：{summary}
現在のスコア：影響{impact} / 難易{difficulty} / 継続{continuity} / 放置{placement} / 心理{mental} / 収益{revenue}
---`,
  },
  {
    label: 'スコアが出にくい場合の診断',
    tool: 'ChatGPT / Perplexity',
    body: `以下のアイデアはスコアが伸び悩んでいます。
次の3点を整理して出力してください。

1. このままだとどうなるか（スコアが低い構造的な理由）
2. どう変えると良くなるか（具体的な変更案）
3. なぜその変更が効くか（市場・構造・心理的な観点から）

---
タイトル：{title}
要約：{summary}
現在のスコア：影響{impact} / 難易{difficulty} / 継続{continuity} / 放置{placement} / 心理{mental} / 収益{revenue}
課題（自分の感想）：{懸念点や引っかかっていることを書く}
---`,
  },
  {
    label: '用途・優先度の提案',
    tool: 'ChatGPT',
    body: `以下のアイデアについて、用途・優先度・着手時期を提案してください。

【用途】商品化 / 検討中 / メモ のいずれかを推薦し、理由を1文で。
【優先カテゴリ】今すぐ / 仕込み / 挑戦 のいずれかを推薦し、理由を1文で。
【時期】今月 / 3ヶ月以内 / 半年〜 / いつか のいずれかを推薦し、理由を1文で。

タイトル：{title}
要約：{summary}
スコア：影響{impact} / 放置{placement} / 収益{revenue}`,
  },
];

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────
export default function LiteMapPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">処理マップ</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          通常版 ideastock でClaudeが自動処理していた内容を、Liteワークフローでどう分担するかの対応表です。<br />
          <strong className="text-gray-700">AIが案を出し、自分が採用・微修正・却下を決める</strong>のが基本フローです。
        </p>
      </div>

      {/* AI役割早見表 */}
      <section>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">AI役割早見表</h2>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#3a3660' }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: '#2e2b50' }}>
                <th className="text-left px-4 py-2.5 text-gray-400 font-medium w-28">ツール</th>
                <th className="text-left px-4 py-2.5 text-gray-400 font-medium">担当領域</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#3a3660' }}>
              {AI_ROLES.map(({ name, color, desc }) => (
                <tr key={name}>
                  <td className="px-4 py-2.5">
                    <span className={`badge text-[11px] ${color}`}>{name}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 leading-relaxed">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          Claude Chat はキャパシティを Claude Code と共有するため基本使用しません。チャット用途は上記の各AIで代替します。
        </p>
      </section>

      {/* 処理分担表 */}
      <section>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">処理分担表</h2>
        <div className="rounded-xl border overflow-x-auto" style={{ borderColor: '#3a3660' }}>
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr style={{ backgroundColor: '#2e2b50' }}>
                {['処理', '通常版', '担当', '主担当ツール', '代替候補', '人間の関与タイミング', '入力先'].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 text-gray-400 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#3a3660' }}>
              {ROWS.map((row) => (
                <tr key={row.process} className="transition-colors hover:bg-brand-50">
                  <td className="px-3 py-2.5 font-medium text-gray-700 whitespace-nowrap">{row.process}</td>
                  <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">{row.current}</td>
                  <td className="px-3 py-2.5">
                    <span className={`badge text-[10px] ${WHO_STYLE[row.who]}`}>{row.who}</span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">{row.primary}</td>
                  <td className="px-3 py-2.5 text-gray-400">{row.alt}</td>
                  <td className="px-3 py-2.5 text-gray-500 leading-relaxed">{row.humanRole}</td>
                  <td className="px-3 py-2.5 text-brand-600 text-[11px] whitespace-nowrap">{row.destination}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 担当凡例 */}
      <section>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">担当凡例</h2>
        <div className="flex flex-wrap gap-3">
          {(Object.entries(WHO_STYLE) as [Who, string][]).map(([k, v]) => (
            <span key={k} className={`badge text-xs px-3 py-1.5 ${v}`}>{k}</span>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          「外部AI」はプロンプトを貼って実行し、結果をLiteフォームに転記する方式です。<br />
          「人間+AI」はAIが案・根拠・改善理由を出し、<strong className="text-gray-700">自分が採用・微修正・却下を決める</strong>フローです。<br />
          Claude Code は実装専任。設計・整理・チャット用途には使いません。
        </p>
      </section>

      {/* プロンプトライブラリ */}
      <section>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">プロンプトライブラリ</h2>
        <p className="text-xs text-gray-500 mb-4">
          各プロンプトの推奨ツールを記載しています。コピーして該当ツールに貼り付けてください。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROMPTS.map(({ label, tool, body }) => (
            <div key={label} className="rounded-xl border p-4 flex flex-col gap-2" style={{ backgroundColor: '#252240', borderColor: '#3a3660' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-600">{label}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{tool}</span>
              </div>
              <pre className="text-xs whitespace-pre-wrap leading-relaxed text-gray-500" style={{ maxHeight: 180, overflow: 'auto' }}>
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
          <li>各処理の「入力・出力・入力先」の境界が明確なので、n8nのノードとして1:1でマッピング可能</li>
          <li>ステータス管理は Supabase に永続化済み（lite_status カラム）。n8n トリガーの起点として使える</li>
          <li>プロンプトをDBに保存することで、「プロンプト差し替え」だけでAI担当ツールを変更できる構造になる</li>
          <li>「外部AI処理待ち」ステータスを Webhook トリガーにすれば、n8n → AI → 自動転記のフローが組める</li>
          <li>AI担当をベタ書きせず「プロンプト+ツール名」で分離しているため、将来のモデル切り替えに対応しやすい</li>
        </ul>
      </section>
    </div>
  );
}
