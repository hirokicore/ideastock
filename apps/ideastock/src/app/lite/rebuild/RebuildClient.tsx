'use client';

import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { IdeaStock } from '@/types';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
type FieldGap = {
  field: string;
  label: string;
  checkMissing: (s: IdeaStock) => boolean;
  prompt: (s: IdeaStock) => string;
};

const FIELD_GAPS: FieldGap[] = [
  {
    field: 'summary',
    label: '要約',
    checkMissing: (s) => !s.summary,
    prompt: (s) => `以下のテキストを2〜3文で要約してください。\n\n---\n${s.raw_text}\n---`,
  },
  {
    field: 'tags',
    label: 'タグ',
    checkMissing: (s) => !s.tags?.length,
    prompt: (s) => `以下のテキストから関連キーワードを5〜8個、カンマ区切りで抽出してください。\n\n---\n${s.raw_text}\n---`,
  },
  {
    field: 'impact_score',
    label: 'スコア（全軸）',
    checkMissing: (s) => s.impact_score == null,
    prompt: (s) => `以下のアイデアを1〜5のスコアで評価してください（「スコア名: 数値 // 理由」形式）。

- impact_score: 市場規模・影響（5が最大）
- difficulty_score: 実現難易度（5が最難）
- continuity_score: 継続性（5が高い）
- placement_score: 放置型度（5が最も放置型）
- mental_score: 心理的軽さ（5がラク）
- revenue_score: 収益ポテンシャル（5が最大）

タイトル：${s.title}
要約：${s.summary ?? s.raw_text.slice(0, 200)}`,
  },
  {
    field: 'summary_refine',
    label: '改善（refine）',
    checkMissing: () => true,
    prompt: (s) => `以下のアイデアについて改善提案をしてください。

1. タイトル改善案（1案）
2. 要約の改善（2〜3文）
3. 市場性・実現性・継続性それぞれの改善ポイント（1〜2文ずつ）
4. スコアの再評価（1〜5）

---
タイトル：${s.title}
要約：${s.summary ?? '（未設定）'}
現在のスコア：影響${s.impact_score ?? '?'} / 難易${s.difficulty_score ?? '?'} / 継続${s.continuity_score ?? '?'}
---`,
  },
];

function isMissing(s: IdeaStock, f: FieldGap) {
  return f.checkMissing(s);
}

function gapCount(s: IdeaStock) {
  return FIELD_GAPS.filter((f) => f.field !== 'summary_refine' && isMissing(s, f)).length;
}

// ──────────────────────────────────────────────
// PromptCard
// ──────────────────────────────────────────────
function PromptCard({ label, prompt }: { label: string; prompt: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: '#4a4678', backgroundColor: '#1a1826' }}>
      <div className="flex items-center justify-between">
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {label}
        </button>
        <button onClick={copy} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
          style={{ backgroundColor: '#2e2b50', color: '#a8a4cc' }}>
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'コピー済み' : 'コピー'}
        </button>
      </div>
      {open && (
        <pre className="mt-2 text-xs whitespace-pre-wrap text-gray-500 leading-relaxed" style={{ maxHeight: 180, overflow: 'auto' }}>
          {prompt}
        </pre>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Stock row
// ──────────────────────────────────────────────
function StockRebuildRow({ stock }: { stock: IdeaStock }) {
  const [open, setOpen] = useState(false);
  const gaps = FIELD_GAPS.filter((f) => f.field !== 'summary_refine' && isMissing(stock, f));
  const hasGaps = gaps.length > 0;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#252240', borderColor: '#3a3660' }}>
      {/* Header row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-brand-50 transition-colors"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="text-sm font-medium text-gray-800 truncate">{stock.title}</span>
          {hasGaps ? (
            <span className="badge bg-yellow-100 text-yellow-700 text-[10px] flex-shrink-0">
              不足 {gaps.length}件
            </span>
          ) : (
            <span className="badge bg-green-100 text-green-700 text-[10px] flex-shrink-0">フィールド充足</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <Link
            href={`/stocks/${stock.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-brand-600 hover:text-brand-500 flex items-center gap-1"
          >
            詳細 <ExternalLink size={11} />
          </Link>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Expanded */}
      {open && (
        <div className="border-t px-4 py-4 space-y-4" style={{ borderColor: '#3a3660' }}>

          {/* Missing fields */}
          {hasGaps && (
            <div>
              <p className="text-xs text-yellow-700 mb-3">
                以下のフィールドが未入力です。プロンプトを外部AIに貼り付け、結果を詳細ページで更新してください。
              </p>
              <div className="space-y-2">
                {gaps.map((f) => (
                  <PromptCard key={f.field} label={`${f.label}を生成`} prompt={f.prompt(stock)} />
                ))}
              </div>
            </div>
          )}

          {/* Refine (always shown) */}
          <div>
            <p className="text-xs text-gray-400 mb-2">改善提案（既存フィールドを更新したい場合）</p>
            <PromptCard
              label="アイデア改善プロンプト（refine代替）"
              prompt={FIELD_GAPS.find((f) => f.field === 'summary_refine')!.prompt(stock)}
            />
          </div>

          {/* Current field status */}
          <div className="pt-1">
            <p className="text-xs text-gray-400 mb-2">フィールド充足状況</p>
            <div className="flex flex-wrap gap-2">
              {[
                ['要約', !!stock.summary],
                ['タグ', !!stock.tags?.length],
                ['スコア', stock.impact_score != null],
                ['用途', !!stock.intent],
                ['優先度', !!stock.priority_category],
                ['時期', !!stock.time_slot],
                ['放置度', stock.placement_score != null],
                ['心理', stock.mental_score != null],
                ['収益', stock.revenue_score != null],
              ].map(([label, ok]) => (
                <span
                  key={label as string}
                  className={`badge text-[10px] ${ok ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}
                >
                  {ok ? '✓' : '✕'} {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
export default function RebuildClient({ stocks }: { stocks: IdeaStock[] }) {
  const [showOnlyGaps, setShowOnlyGaps] = useState(true);

  const displayed = showOnlyGaps
    ? stocks.filter((s) => gapCount(s) > 0)
    : stocks;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">既存ストック再構築</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          既存データの不足フィールドを特定し、外部AIへのプロンプトを生成します。
          結果を詳細ページ（/stocks/[id]）に転記することで、Liteワークフローで補完できます。
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          ['総ストック数', stocks.length, 'text-gray-700'],
          ['要補完あり', stocks.filter((s) => gapCount(s) > 0).length, 'text-yellow-700'],
          ['充足済み', stocks.filter((s) => gapCount(s) === 0).length, 'text-green-700'],
        ].map(([label, count, color]) => (
          <div key={label as string} className="rounded-xl border p-4 text-center" style={{ backgroundColor: '#252240', borderColor: '#3a3660' }}>
            <div className={`text-2xl font-black ${color}`}>{count}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowOnlyGaps(true)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
            showOnlyGaps ? 'bg-brand-400 text-white' : 'text-gray-500'
          }`}
          style={!showOnlyGaps ? { backgroundColor: '#2e2b50' } : {}}
        >
          要補完のみ表示
        </button>
        <button
          onClick={() => setShowOnlyGaps(false)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
            !showOnlyGaps ? 'bg-brand-400 text-white' : 'text-gray-500'
          }`}
          style={showOnlyGaps ? { backgroundColor: '#2e2b50' } : {}}
        >
          全件表示
        </button>
        <span className="text-xs text-gray-400">{displayed.length}件</span>
      </div>

      {/* Stock list */}
      <div className="space-y-2">
        {displayed.length === 0 ? (
          <p className="text-center py-12 text-gray-400">対象のストックがありません</p>
        ) : (
          displayed.map((stock) => <StockRebuildRow key={stock.id} stock={stock} />)
        )}
      </div>
    </div>
  );
}
