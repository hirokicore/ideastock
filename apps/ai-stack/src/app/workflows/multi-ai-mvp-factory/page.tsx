import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  Zap,
  User,
  AlertTriangle,
  Lightbulb,
  Rocket,
  Terminal,
  BookOpen,
  Sparkles,
  ChevronRight,
  Users,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────

const AI_TOOLS = [
  {
    name: 'ChatGPT (GPT-4o)',
    role: '全体設計・フォルダ構造・仕様整理',
    url: 'https://chatgpt.com',
    card: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    text: 'text-emerald-900',
  },
  {
    name: 'Gemini',
    role: '全ファイルコードの一括生成・長文出力',
    url: 'https://aistudio.google.com',
    card: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    text: 'text-blue-900',
  },
  {
    name: 'Perplexity',
    role: 'リサーチ・ライブラリ選定・エラー調査',
    url: 'https://www.perplexity.ai',
    card: 'bg-orange-50 border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    text: 'text-orange-900',
  },
  {
    name: 'Claude Code',
    role: 'コード配置・ファイル編集・実行・ビルド・差分反映',
    url: 'https://code.claude.com',
    card: 'bg-brand-50 border-brand-200',
    badge: 'bg-brand-100 text-brand-700',
    text: 'text-brand-900',
  },
  {
    name: 'Vercel',
    role: 'デプロイ・公開確認',
    url: 'https://vercel.com',
    card: 'bg-gray-50 border-gray-200',
    badge: 'bg-gray-100 text-gray-700',
    text: 'text-gray-900',
  },
];

const STEPS = [
  {
    order: 0,
    title: 'CLAUDE.md初期設定',
    tool: 'Claude Code',
    subTool: null,
    mode: 'auto' as const,
    description: 'Claude Code用のプロジェクトルールを定義する。余計な提案を抑え、指示されたコード配置と実行に集中させる。',
    point: 'プロジェクトルートに CLAUDE.md を作成し、以下の方針を含める。必要に応じてプロジェクト固有のルールも追記する。',
    prompt:
      'プロジェクトルートに CLAUDE.md を作成し、次の内容をベースに編集してください：\n- 余計なアドバイスは不要。指示されたコードの配置と実行に集中すること。\n- ファイル作成や編集は、明示されたファイル名・パスのみを対象にすること。\n- 大規模リファクタや設計の提案は、ユーザーから依頼があった場合のみ行うこと。\n- 回答は日本語で行うこと。\nこの他に、このプロジェクトに合いそうな推奨ルールがあれば、簡潔に2〜3行だけ追記してください。',
  },
  {
    order: 1,
    title: '全体設計・フォルダ構造',
    tool: 'ChatGPT (GPT-4o)',
    subTool: 'Perplexity',
    mode: 'auto' as const,
    description: '作りたいアプリの要件をもとに、全体の仕様とフォルダ/ファイル構成を決める。',
    point:
      'まずGPT-4oに要件を渡し、フォルダ階層とファイル一覧をツリー形式で出してもらう。必要に応じてPerplexityで類似サービスやライブラリ候補を調べる。',
    prompt:
      '〇〇なアプリを作りたいです。Next.js（または使用フレームワーク）で、推奨されるフォルダ構成と全ファイル一覧をツリー形式で出してください。',
  },
  {
    order: 2,
    title: '全ファイルコード生成',
    tool: 'Gemini (AI Studio / Advanced)',
    subTool: 'ChatGPT',
    mode: 'auto' as const,
    description: 'GPTが出したフォルダ構造を元に、必要な全ファイルの中身を一括で生成する。',
    point:
      'Geminiにフォルダ構成と要件を渡し、「全ファイルのコードを省略せずに出力」させる。長文でも止まりにくい前提で使う。',
    prompt:
      'このフォルダ構成と要件に基づいて、全てのファイルのコードを省略なしで出力してください。ファイル名のコメントを付けて順番にまとめてください。',
  },
  {
    order: 3,
    title: 'コード配置・ビルド・実行',
    tool: 'Claude Code',
    subTool: null,
    mode: 'auto' as const,
    description: 'Geminiなどで生成したコードを実際のプロジェクトに配置し、依存インストールと起動まで行う。',
    point:
      'Claude Codeは「考える」のではなく「指定されたファイルを作って動かす」作業員として使う。CLAUDE.mdの方針に従わせる。',
    prompt:
      '以下の指示に従って、ファイル作成と実行のみを行ってください。思考や提案は不要です。\n1. src/components/Task.tsx を作成し、下のコードをそのまま貼り付けてください。\n2. src/App.tsx を下のコードで上書きしてください。\n3. 不足しているライブラリがあれば npm install し、その後 npm run dev を実行してください。\n--- コード ---\n[ここにGeminiで生成したコードを貼る]',
  },
  {
    order: 4,
    title: 'トラブルシューティング・修正草案',
    tool: 'Perplexity',
    subTool: 'Gemini',
    mode: 'auto' as const,
    description: '起動やビルド時に出たエラーを調査し、修正コードの草案を作る。',
    point:
      'まずエラー文をPerplexityに貼り付けて原因と最新の解決策を確認し、その上でGeminiに具体的な修正コードを出させる。',
    prompt:
      'Perplexity: 次のエラーの原因と、現時点で推奨される解決策を教えてください。[エラー全文]\n\nGemini: このエラーを解消するために、どのファイルのどの部分をどう修正すべきか、修正後のコードを含めて具体的に教えてください。',
  },
  {
    order: 5,
    title: '修正差分の適用',
    tool: 'Claude Code',
    subTool: null,
    mode: 'auto' as const,
    description: 'Geminiなどが出した修正コードを、既存ファイルに差分として適用する。',
    point:
      '可能な限り「変更が必要な関数やブロックだけ」を渡し、Claude Codeにはどのファイルのどの位置を置き換えるかを明示する。',
    prompt:
      'src/auth/validateToken.ts の validateToken 関数だけを、以下のコードに差し替えてください。他の部分は触らないでください。\n--- 新しい関数コード ---\n...',
  },
  {
    order: 6,
    title: 'UI・コピー調整',
    tool: 'ChatGPT',
    subTool: 'Claude Chat',
    mode: 'auto' as const,
    description: 'ボタン文言・説明文・ラベルなど、UIの細かい文言や配置を整える。',
    point:
      '実際の画面キャプチャやコンポーネントコードを渡して「わかりやすい日本語に」「トーンを統一」などを依頼する。',
    prompt:
      'このコンポーネントのUI文言を、初心者にもわかりやすい日本語に整えてください。トーンはフラットで丁寧にしてください。[コンポーネントコード]',
  },
  {
    order: 7,
    title: '本番確認・デプロイ',
    tool: 'Hiroki',
    subTool: 'Vercel',
    mode: 'manual' as const,
    description: 'ローカル／プレビュー環境で動作確認を行い、問題なければVercelなどにデプロイする。',
    point:
      '主要なユーザーフローを実際に触ってチェックリスト形式で確認し、OKならデプロイ。バグや気づきはIssueとしてTodo化する。',
    prompt: '（自分用メモ）/signup → /dashboard → /settings の3フローを必ず通ってからデプロイ。',
  },
];

const CLAUDE_MD = `## Communication
- 回答は日本語。
- 前置きは不要。結論から書く。
- コードの解説は依頼があった時だけ行う。
- 指示されていない設計変更や提案はしない。
- パフォーマンスとトークン効率を優先する。

## Working style
- 明示されたファイルだけを編集する。
- 可能なら変更はまとめて一括で行う。
- 変更後は必要最小限の確認のみ行う。`;

const GEMINI_EXAMPLE = `### src/app/page.tsx
\`\`\`tsx
import { FC } from 'react';

const Page: FC = () => {
  return <div>Hello World</div>;
};

export default Page;
\`\`\`

### src/components/Header.tsx
\`\`\`tsx
export const Header = () => (
  <header>...</header>
);
\`\`\``;

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="text-brand-600">{icon}</span>
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</h2>
    </div>
  );
}

function ModeBadge({ mode }: { mode: 'auto' | 'manual' }) {
  return mode === 'auto' ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
      <Zap size={10} />
      auto
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
      <User size={10} />
      manual
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function MultiAiMvpFactoryPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4">

        {/* ── Navigation ── */}
        <div className="pt-8 pb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft size={15} />
            AI Stack に戻る
          </Link>
        </div>

        {/* ── Hero ── */}
        <div className="py-8 border-b border-gray-200 mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🏭</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">マルチAI量産開発フロー</h1>
              <p className="text-sm text-gray-500 mt-1">複数AIを役割分担させてMVPを高速に量産する開発フロー</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            {[
              {
                label: 'フローの目的',
                body: '設計・コード生成・配置・修正・デプロイを複数AIで分担し、1人でもMVPを高速に量産する。',
              },
              {
                label: '役割分担の考え方',
                body: '設計はGPT、長文コード生成はGemini、調査はPerplexity、配置と実行はClaude Codeが担当。人間は司令塔と最終判断に集中する。',
              },
              {
                label: '改善メモの考え方',
                body: '細かい改善は都度実装せず、メモを貯めて拡張パックとしてまとめて反映する。無駄なトークン消費を減らす。',
              },
              {
                label: 'Claude Codeの使い方',
                body: '提案・思考ではなく「配置・実行」に徹させる。CLAUDE.mdで制約を事前に定義しておくのがポイント。',
              },
            ].map((item) => (
              <div key={item.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-semibold text-brand-600 mb-1.5">{item.label}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 使用AIと役割 ── */}
        <section className="mb-12">
          <SectionTitle icon={<Users size={16} />} title="使用AIと役割" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {AI_TOOLS.map((t) => (
              <a
                key={t.name}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group block border rounded-xl p-4 transition-shadow hover:shadow-md ${t.card}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.badge}`}>{t.name}</span>
                  <ExternalLink size={13} className="text-gray-400 group-hover:text-gray-600 flex-shrink-0 mt-0.5" />
                </div>
                <p className={`text-sm leading-relaxed ${t.text}`}>{t.role}</p>
              </a>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">補助的に Cursor / Roo Code を使う場合もある。</p>
        </section>

        {/* ── フロー全体 ── */}
        <section className="mb-12">
          <SectionTitle icon={<ChevronRight size={16} />} title="フロー全体" />
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {STEPS.map((step, i) => (
              <div
                key={step.order}
                className={`flex items-center gap-4 px-5 py-3.5 ${i !== STEPS.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                  {step.order}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {step.tool}
                    {step.subTool ? ` + ${step.subTool}` : ''}
                  </p>
                </div>
                <ModeBadge mode={step.mode} />
              </div>
            ))}
          </div>
        </section>

        {/* ── ステップ詳細 ── */}
        <section className="mb-12">
          <SectionTitle icon={<Terminal size={16} />} title="ステップ詳細" />
          <div className="space-y-4">
            {STEPS.map((step) => (
              <div key={step.order} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    {step.order}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
                      <ModeBadge mode={step.mode} />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                        {step.tool}
                      </span>
                      {step.subTool && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                          +{step.subTool}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2 leading-relaxed">{step.description}</p>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed pl-3 border-l-2 border-brand-200">
                  {step.point}
                </p>
                <details className="group">
                  <summary className="flex items-center gap-1.5 text-xs font-medium text-brand-600 cursor-pointer hover:text-brand-700 list-none">
                    <ChevronRight
                      size={12}
                      className="transition-transform duration-150 group-open:rotate-90"
                    />
                    プロンプト例を見る
                  </summary>
                  <pre className="mt-3 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">{step.prompt}</pre>
                </details>
              </div>
            ))}
          </div>
        </section>

        {/* ── CLAUDE.md サンプル ── */}
        <section className="mb-12">
          <SectionTitle icon={<BookOpen size={16} />} title="CLAUDE.md サンプル" />
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              プロジェクトルートに{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-brand-700">
                CLAUDE.md
              </code>{' '}
              を置くことで、Claude Codeの挙動をプロジェクト単位で制御できる。
              余計な提案を抑え、「指示されたコード配置と実行に集中」させるのが目的。
            </p>
            <pre className="text-xs bg-gray-900 text-green-300 rounded-xl p-5 overflow-x-auto whitespace-pre leading-relaxed font-mono">{CLAUDE_MD}</pre>
            <p className="mt-3 text-xs text-gray-400">このベースにプロジェクト固有のルールを追記して使う。</p>
          </div>
        </section>

        {/* ── Gemini出力のコツ ── */}
        <section className="mb-12">
          <SectionTitle icon={<Sparkles size={16} />} title="Gemini 出力のコツ" />
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <ul className="space-y-4 mb-5">
              {[
                {
                  label: '全ファイルを一括出力させる',
                  body: 'Geminiは長文出力が得意なので「省略なし」を明示して全ファイルをまとめて出させる。',
                },
                {
                  label: 'ファイルパスをヘッダーに付けさせる',
                  body: '各ファイルを「### パス名 + コードブロック」形式で出力させると、Claude Codeへの貼り付けが楽になる。',
                },
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-xs font-medium text-gray-500 mb-2">出力フォーマット例</p>
            <pre className="text-xs bg-gray-900 text-green-300 rounded-xl p-4 overflow-x-auto font-mono leading-relaxed whitespace-pre">{GEMINI_EXAMPLE}</pre>
          </div>
        </section>

        {/* ── 例外時の避難先 ── */}
        <section className="mb-12">
          <SectionTitle icon={<AlertTriangle size={16} />} title="例外時の避難先" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full inline-block mb-3">
                Claude Code 停止時
              </p>
              <ul className="space-y-2">
                {[
                  'Gemini / ChatGPT でコードや修正案を作る',
                  '必要なら Cursor / Roo Code / VS Code に逃がす',
                ].map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-gray-700">
                    <ChevronRight size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full inline-block mb-3">
                Gemini 制限時
              </p>
              <ul className="space-y-2">
                {[
                  'ChatGPT で構造だけ出す',
                  'Claude Code では差分適用中心にする',
                  '必要なら小さく分割して再生成する',
                ].map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-gray-700">
                    <ChevronRight size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── 改善メモ運用 ── */}
        <section className="mb-12">
          <SectionTitle icon={<Lightbulb size={16} />} title="改善メモ運用" />
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              {[
                {
                  step: '1',
                  label: 'メモ貯蓄',
                  body: '「これ追加したい」「これ要らないかも」はその都度実装せず、まずメモとして記録する。',
                },
                {
                  step: '2',
                  label: '設計図へ反映',
                  body: '一定期間使った後、メモをまとめて設計図へ反映する。',
                },
                {
                  step: '3',
                  label: '拡張パック実装',
                  body: 'まとまったら拡張パックとして一括実装する。同じ場所を何度も書き換えるトークン消費を防ぐ。',
                },
              ].map((item) => (
                <div key={item.step} className="flex-1 bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 bg-brand-100 text-brand-700 text-xs font-bold rounded-full flex items-center justify-center">
                      {item.step}
                    </span>
                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
              目的：同じ場所を何度も書き換えて発生する無駄なトークン消費を減らし、まとめて実装することで変更の一貫性を保つ。
            </p>
          </div>
        </section>

        {/* ── デプロイ補足 ── */}
        <section className="mb-12">
          <SectionTitle icon={<Rocket size={16} />} title="デプロイ補足" />
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <ul className="space-y-3">
              {[
                'Next.js は通常そのまま Vercel に載せられる。追加設定は基本不要。',
                'vercel.json は rewrites や headers が必要な場合のみ追加する。',
                'デプロイ前に scripts・環境変数・npm run build の通過を確認する。',
              ].map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-brand-500 rounded-full mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

      </div>
    </main>
  );
}
