'use client';

import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, ExternalLink, Save } from 'lucide-react';
import Link from 'next/link';
import type { IdeaStock } from '@/types';

// ──────────────────────────────────────────────
// Prompt definitions（field → prompt template）
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
    label: 'スコア（全6軸）',
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

function isMissing(s: IdeaStock, f: FieldGap) { return f.checkMissing(s); }
function gapCount(s: IdeaStock) {
  return FIELD_GAPS.filter((f) => f.field !== 'summary_refine' && isMissing(s, f)).length;
}

// ──────────────────────────────────────────────
// Sub-components
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
          AIプロンプト: {label}
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

function ScoreInput({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-[11px] text-gray-400 mb-1">{label}</div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === String(n) ? '' : String(n))}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
              value === String(n) ? 'bg-brand-400 text-white' : 'text-gray-500'
            }`}
            style={value !== String(n) ? { backgroundColor: '#2e2b50' } : {}}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Edit form state per stock
// ──────────────────────────────────────────────
type ScoreFields = {
  impact_score: string;
  difficulty_score: string;
  continuity_score: string;
  placement_score: string;
  mental_score: string;
  revenue_score: string;
};

type EditState = {
  summary: string;
  tags: string;       // comma-separated
  scores: ScoreFields;
};

function initEdit(s: IdeaStock): EditState {
  return {
    summary: s.summary ?? '',
    tags: s.tags?.join(', ') ?? '',
    scores: {
      impact_score:     s.impact_score     != null ? String(s.impact_score)     : '',
      difficulty_score: s.difficulty_score != null ? String(s.difficulty_score) : '',
      continuity_score: s.continuity_score != null ? String(s.continuity_score) : '',
      placement_score:  s.placement_score  != null ? String(s.placement_score)  : '',
      mental_score:     s.mental_score     != null ? String(s.mental_score)     : '',
      revenue_score:    s.revenue_score    != null ? String(s.revenue_score)    : '',
    },
  };
}

const SCORE_LABELS: { key: keyof ScoreFields; label: string }[] = [
  { key: 'impact_score',     label: 'インパクト' },
  { key: 'difficulty_score', label: '難易度（5=最難）' },
  { key: 'continuity_score', label: '継続性' },
  { key: 'placement_score',  label: '放置度（5=放置型）' },
  { key: 'mental_score',     label: '心理的軽さ' },
  { key: 'revenue_score',    label: '収益ポテンシャル' },
];

// ──────────────────────────────────────────────
// Stock row with editable fields
// ──────────────────────────────────────────────
function StockRebuildRow({ stock: initialStock }: { stock: IdeaStock }) {
  const [stock, setStock] = useState<IdeaStock>(initialStock);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<EditState>(() => initEdit(initialStock));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  const gaps = FIELD_GAPS.filter((f) => f.field !== 'summary_refine' && isMissing(stock, f));
  const hasGaps = gaps.length > 0;

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    // 変更のあったフィールドだけを収集
    const payload: Record<string, unknown> = {};

    const trimmedSummary = edit.summary.trim();
    if (trimmedSummary !== (stock.summary ?? '')) {
      payload.summary = trimmedSummary || null;
    }

    const newTags = edit.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const oldTags = stock.tags ?? [];
    if (JSON.stringify(newTags) !== JSON.stringify(oldTags)) {
      payload.tags = newTags;
    }

    for (const { key } of SCORE_LABELS) {
      const newVal = edit.scores[key];
      const oldVal = stock[key] != null ? String(stock[key]) : '';
      if (newVal !== oldVal) {
        payload[key] = newVal ? Number(newVal) : null;
      }
    }

    if (Object.keys(payload).length === 0) {
      showToast(false, '変更がありません');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/stocks/${stock.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const { error } = await res.json();
        showToast(false, error ?? '保存に失敗しました');
        return;
      }
      // ローカル状態を更新（充足状況バッジを即時反映）
      const updated: IdeaStock = {
        ...stock,
        summary: 'summary' in payload ? (payload.summary as string | null) : stock.summary,
        tags:    'tags'    in payload ? (payload.tags as string[])         : stock.tags,
        impact_score:     'impact_score'     in payload ? (payload.impact_score     as number | null) : stock.impact_score,
        difficulty_score: 'difficulty_score' in payload ? (payload.difficulty_score as number | null) : stock.difficulty_score,
        continuity_score: 'continuity_score' in payload ? (payload.continuity_score as number | null) : stock.continuity_score,
        placement_score:  'placement_score'  in payload ? (payload.placement_score  as number | null) : stock.placement_score,
        mental_score:     'mental_score'     in payload ? (payload.mental_score     as number | null) : stock.mental_score,
        revenue_score:    'revenue_score'    in payload ? (payload.revenue_score    as number | null) : stock.revenue_score,
      };
      setStock(updated);
      setEdit(initEdit(updated));
      showToast(true, '保存しました');
    } catch {
      showToast(false, 'ネットワークエラー');
    } finally {
      setSaving(false);
    }
  };

  const updatedGaps = FIELD_GAPS.filter((f) => f.field !== 'summary_refine' && isMissing(stock, f));

  return (
    <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#252240', borderColor: '#3a3660' }}>
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-brand-50 transition-colors"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="text-sm font-medium text-gray-800 truncate">{stock.title}</span>
          {hasGaps ? (
            <span className="badge bg-yellow-100 text-yellow-700 text-[10px] flex-shrink-0">
              不足 {updatedGaps.length}件
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
        <div className="border-t px-4 py-4 space-y-5" style={{ borderColor: '#3a3660' }}>

          {/* Toast */}
          {toast && (
            <div className={`text-xs px-3 py-2 rounded-lg ${toast.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {toast.msg}
            </div>
          )}

          {/* ── 要約 ── */}
          {FIELD_GAPS.find((f) => f.field === 'summary') && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700">要約</span>
                {!stock.summary
                  ? <span className="badge bg-yellow-100 text-yellow-700 text-[10px]">未入力</span>
                  : <span className="badge bg-green-100 text-green-700 text-[10px]">入力済み</span>}
              </div>
              <textarea
                className="form-textarea text-xs"
                rows={3}
                value={edit.summary}
                onChange={(e) => setEdit((p) => ({ ...p, summary: e.target.value }))}
                placeholder="2〜3文の要約を入力してください"
              />
              <PromptCard label="要約生成" prompt={FIELD_GAPS.find((f) => f.field === 'summary')!.prompt(stock)} />
            </div>
          )}

          {/* ── タグ ── */}
          {FIELD_GAPS.find((f) => f.field === 'tags') && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700">タグ</span>
                {!stock.tags?.length
                  ? <span className="badge bg-yellow-100 text-yellow-700 text-[10px]">未入力</span>
                  : <span className="badge bg-green-100 text-green-700 text-[10px]">入力済み</span>}
              </div>
              <input
                className="form-input text-xs"
                value={edit.tags}
                onChange={(e) => setEdit((p) => ({ ...p, tags: e.target.value }))}
                placeholder="SaaS, フィットネス, 自動化（カンマ区切り）"
              />
              <PromptCard label="タグ抽出" prompt={FIELD_GAPS.find((f) => f.field === 'tags')!.prompt(stock)} />
            </div>
          )}

          {/* ── スコア ── */}
          {FIELD_GAPS.find((f) => f.field === 'impact_score') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700">スコア（全6軸）</span>
                {stock.impact_score == null
                  ? <span className="badge bg-yellow-100 text-yellow-700 text-[10px]">未入力</span>
                  : <span className="badge bg-green-100 text-green-700 text-[10px]">入力済み</span>}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SCORE_LABELS.map(({ key, label }) => (
                  <ScoreInput
                    key={key}
                    label={label}
                    value={edit.scores[key]}
                    onChange={(v) => setEdit((p) => ({ ...p, scores: { ...p.scores, [key]: v } }))}
                  />
                ))}
              </div>
              <PromptCard label="スコアリング" prompt={FIELD_GAPS.find((f) => f.field === 'impact_score')!.prompt(stock)} />
            </div>
          )}

          {/* ── 保存ボタン ── */}
          <div className="flex justify-end pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-xs py-2 px-4"
            >
              {saving ? '保存中…' : <><Save size={13} /> このストックを保存</>}
            </button>
          </div>

          {/* ── 改善プロンプト（always shown） ── */}
          <div className="border-t pt-4" style={{ borderColor: '#3a3660' }}>
            <p className="text-xs text-gray-400 mb-2">改善提案（既存フィールドを全体的に更新したい場合）</p>
            <PromptCard
              label="アイデア改善（refine代替）"
              prompt={FIELD_GAPS.find((f) => f.field === 'summary_refine')!.prompt(stock)}
            />
          </div>

          {/* ── 充足状況 ── */}
          <div>
            <p className="text-xs text-gray-400 mb-2">フィールド充足状況</p>
            <div className="flex flex-wrap gap-2">
              {([
                ['要約',  !!stock.summary],
                ['タグ',  !!stock.tags?.length],
                ['スコア', stock.impact_score != null],
                ['用途',  !!stock.intent],
                ['優先度', !!stock.priority_category],
                ['時期',  !!stock.time_slot],
                ['放置度', stock.placement_score != null],
                ['心理',  stock.mental_score != null],
                ['収益',  stock.revenue_score != null],
              ] as [string, boolean][]).map(([label, ok]) => (
                <span key={label} className={`badge text-[10px] ${ok ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
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
          不足フィールドを直接編集して保存できます。
          AIプロンプトをコピーして外部AIで処理し、結果を貼り付けてから保存してください。
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {([
          ['総ストック数', stocks.length, 'text-gray-700'],
          ['要補完あり',  stocks.filter((s) => gapCount(s) > 0).length, 'text-yellow-700'],
          ['充足済み',    stocks.filter((s) => gapCount(s) === 0).length, 'text-green-700'],
        ] as [string, number, string][]).map(([label, count, color]) => (
          <div key={label} className="rounded-xl border p-4 text-center" style={{ backgroundColor: '#252240', borderColor: '#3a3660' }}>
            <div className={`text-2xl font-black ${color}`}>{count}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowOnlyGaps(true)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${showOnlyGaps ? 'bg-brand-400 text-white' : 'text-gray-500'}`}
          style={!showOnlyGaps ? { backgroundColor: '#2e2b50' } : {}}
        >
          要補完のみ表示
        </button>
        <button
          onClick={() => setShowOnlyGaps(false)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${!showOnlyGaps ? 'bg-brand-400 text-white' : 'text-gray-500'}`}
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
