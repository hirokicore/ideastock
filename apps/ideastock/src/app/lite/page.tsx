import Link from 'next/link';
import { Plus, List, Map, RefreshCw, Brain, Workflow, UserCheck, Puzzle } from 'lucide-react';

const PAGES = [
  {
    href: '/lite/new',
    Icon: Plus,
    title: '新規入力',
    desc: 'テキストを貼り付けて段階的に整理。外部AIへの指示プロンプトも表示。',
    color: 'text-brand-500',
  },
  {
    href: '/lite/stocks',
    Icon: List,
    title: 'ストック一覧',
    desc: '処理ステータス管理付きの一覧。どのアイデアが「どの段階か」を把握。',
    color: 'text-green-700',
  },
  {
    href: '/lite/map',
    Icon: Map,
    title: '処理マップ',
    desc: '全処理を「誰が・何ツールで・どう担当するか」の対応表として参照。',
    color: 'text-yellow-700',
  },
  {
    href: '/lite/rebuild',
    Icon: RefreshCw,
    title: '既存ストック再構築',
    desc: '既存データの不足フィールドをLiteワークフローで補完・更新する手順ページ。',
    color: 'text-purple-700',
  },
];

const PHILOSOPHY = [
  {
    Icon: Workflow,
    title: '処理を分割・段階化する',
    body: '1つのAIに全部丸投げせず、「入力」「軽処理」「重処理」「人間判断」を分けて管理。途中修正・部分再処理が自然にできる。',
  },
  {
    Icon: UserCheck,
    title: 'Human-in-the-Loop',
    body: '自動化するほど修正が難しくなる。必要な箇所で人間判断を挟み、誤りに早く気づける構造を保つ。',
  },
  {
    Icon: Puzzle,
    title: 'AI担当は差し替え可能に',
    body: '「要約はChatGPT」「スコアはClaude」のように役割を分けて、将来のモデル更新・ツール変更に対応しやすくする。',
  },
  {
    Icon: Brain,
    title: 'まず自分のためのOS',
    body: 'ideastock の本来の目的（思考の保管・整理）を維持しながら、クラウドAPI依存を最小化。一部だけ外部化できる余地を持たせる。',
  },
];

export default function LitePage() {
  return (
    <div className="space-y-10">

      {/* Hero */}
      <div className="rounded-2xl p-8 border" style={{ backgroundColor: '#252240', borderColor: '#3a3660' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-50 text-brand-600">LITE MODE</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">IdeaStock Lite</h1>
        <p className="text-gray-500 leading-relaxed max-w-2xl">
          「機能削減版」ではなく、<strong className="text-gray-700">AI処理負担を分割・段階化したワークフロー再設計版</strong>。<br />
          クラウドAPIへの一括依存を避け、人間・サイト・外部AIの役割を分けて管理します。
        </p>
        <div className="mt-4 flex gap-3 text-sm">
          <span className="px-3 py-1 rounded-lg border" style={{ borderColor: '#4a4678', color: '#8e8ab4' }}>既存DBそのまま使用</span>
          <span className="px-3 py-1 rounded-lg border" style={{ borderColor: '#4a4678', color: '#8e8ab4' }}>自動分析なし</span>
          <span className="px-3 py-1 rounded-lg border" style={{ borderColor: '#4a4678', color: '#8e8ab4' }}>ステータス管理あり</span>
        </div>
      </div>

      {/* Philosophy */}
      <section>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">設計思想</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PHILOSOPHY.map(({ Icon, title, body }) => (
            <div key={title} className="rounded-xl p-5 border" style={{ backgroundColor: '#252240', borderColor: '#3a3660' }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className="text-brand-500" />
                <span className="text-sm font-semibold text-gray-800">{title}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pages */}
      <section>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">ページ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PAGES.map(({ href, Icon, title, desc, color }) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl p-5 border hover:border-brand-200 transition-all group"
              style={{ backgroundColor: '#252240', borderColor: '#3a3660' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={color} />
                <span className="text-sm font-semibold text-gray-800 group-hover:text-brand-700 transition-colors">{title}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* vs. Full */}
      <section>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">通常版との役割差分</h2>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#3a3660' }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: '#2e2b50' }}>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">処理</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">通常版</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Lite版</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#3a3660' }}>
              {[
                ['要約・タグ生成',       'Claude 自動',         '外部AI（人間が実行）'],
                ['スコアリング',         'Claude 自動',         '外部AI + 人間判断で入力'],
                ['類似検索',             'Claude 自動',         '手動確認 or 再構築ページ'],
                ['アイデア展開',         'Claude 自動',         '外部AI（プロンプト提供）'],
                ['ステータス管理',       'なし',                'ローカル管理（6段階）'],
                ['保存',                 'API経由（分析と一体）', '直接DB保存（分析と分離）'],
              ].map(([process, full, lite]) => (
                <tr key={process}>
                  <td className="px-4 py-3 text-gray-600 font-medium">{process}</td>
                  <td className="px-4 py-3 text-gray-500">{full}</td>
                  <td className="px-4 py-3 text-brand-600">{lite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
