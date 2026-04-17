'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { IdeaStock, LiteStatus, Intent, PriorityCategory } from '@/types';
import { formatDate } from '@/lib/utils';

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
const STATUS_LIST: LiteStatus[] = [
  '未整理', '軽処理済み', '外部AI処理待ち', '入力戻し待ち', '詳細化済み', '要修正',
];

const LS_KEY = 'ideastock_lite_status';

// ──────────────────────────────────────────────
// localStorage helpers (backup / offline fallback)
// ──────────────────────────────────────────────
function loadLsStatuses(): Record<string, LiteStatus> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}'); } catch { return {}; }
}

function saveLsStatus(id: string, s: LiteStatus) {
  const current = loadLsStatuses();
  localStorage.setItem(LS_KEY, JSON.stringify({ ...current, [id]: s }));
}

// ──────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────
function statusStyle(s: LiteStatus): string {
  switch (s) {
    case '未整理':         return 'bg-gray-100 text-gray-500';
    case '軽処理済み':     return 'bg-blue-100 text-blue-700';
    case '外部AI処理待ち': return 'bg-yellow-100 text-yellow-700';
    case '入力戻し待ち':   return 'bg-orange-50 text-orange-600';
    case '詳細化済み':     return 'bg-green-100 text-green-700';
    case '要修正':         return 'bg-red-100 text-red-700';
  }
}

function intentStyle(v: Intent) {
  if (v === '商品化') return 'bg-green-100 text-green-700';
  if (v === '検討中') return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-500';
}

function priorityStyle(v: PriorityCategory) {
  if (v === '今すぐ') return 'bg-red-100 text-red-700';
  if (v === '仕込み') return 'bg-blue-100 text-blue-700';
  return 'bg-purple-100 text-purple-700';
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────
export default function LiteStocksClient({ initialStocks }: { initialStocks: IdeaStock[] }) {
  // クライアント側のステータスオーバーレイ
  // 優先順位: Supabase値(initialStocks) > localStorage(バックアップ) > デフォルト'未整理'
  const [localOverride, setLocalOverride] = useState<Record<string, LiteStatus>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [filterStatus, setFilterStatus] = useState<LiteStatus | 'すべて'>('すべて');
  const [filterIntent, setFilterIntent] = useState<Intent | 'すべて'>('すべて');

  // 初回マウント時: localStorageをバックアップとして読み込む
  // (Supabaseに値がないストックのフォールバック用)
  useEffect(() => {
    setLocalOverride(loadLsStatuses());
  }, []);

  // Supabase値を正として、なければlocalStorage、なければデフォルト
  const statusOf = (stock: IdeaStock): LiteStatus =>
    stock.lite_status ?? localOverride[stock.id] ?? '未整理';

  const handleStatusChange = async (stock: IdeaStock, next: LiteStatus) => {
    // 楽観的UI更新
    setLocalOverride((prev) => ({ ...prev, [stock.id]: next }));
    saveLsStatus(stock.id, next); // localStorageにも同期

    setSaving((prev) => ({ ...prev, [stock.id]: true }));
    try {
      const res = await fetch(`/api/stocks/${stock.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lite_status: next }),
      });
      if (!res.ok) {
        // 失敗時はロールバック
        const prev = stock.lite_status ?? localOverride[stock.id] ?? '未整理';
        setLocalOverride((o) => ({ ...o, [stock.id]: prev }));
      }
    } catch {
      // ネットワークエラー: localStorageの値は残るので次回ロード時にも保持
    } finally {
      setSaving((prev) => ({ ...prev, [stock.id]: false }));
    }
  };

  const stocks = useMemo(() => {
    let list = [...initialStocks];
    if (filterStatus !== 'すべて') list = list.filter((s) => statusOf(s) === filterStatus);
    if (filterIntent !== 'すべて') list = list.filter((s) => s.intent === filterIntent);
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStocks, filterStatus, filterIntent, localOverride]);

  const counts = useMemo(() => {
    const m: Partial<Record<LiteStatus | 'すべて', number>> = { 'すべて': initialStocks.length };
    for (const s of STATUS_LIST) {
      m[s] = initialStocks.filter((st) => statusOf(st) === s).length;
    }
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStocks, localOverride]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          ストック一覧（Lite）
          <span className="ml-2 text-sm font-normal text-gray-400">{stocks.length}件</span>
        </h1>
        <Link href="/lite/new" className="btn-primary text-sm py-2 px-4">
          + 新規入力
        </Link>
      </div>

      {/* Status filter */}
      <div className="rounded-2xl border p-4 space-y-3" style={{ backgroundColor: '#252240', borderColor: '#3a3660' }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 font-medium w-20">ステータス</span>
          {(['すべて', ...STATUS_LIST] as (LiteStatus | 'すべて')[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterStatus === s ? 'bg-brand-400 text-white' : statusStyle(s as LiteStatus)
              }`}
              style={filterStatus !== s && s === 'すべて' ? { backgroundColor: '#2e2b50', color: '#8e8ab4' } : {}}
            >
              {s} {counts[s] != null && counts[s]! > 0 ? `(${counts[s]})` : ''}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 font-medium w-20">用途</span>
          {(['すべて', '商品化', '検討中', 'メモ'] as (Intent | 'すべて')[]).map((v) => (
            <button
              key={v}
              onClick={() => setFilterIntent(v)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterIntent === v ? 'bg-brand-400 text-white' : 'text-gray-500 hover:bg-brand-50'
              }`}
              style={filterIntent !== v ? { backgroundColor: '#2e2b50' } : {}}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {stocks.length === 0 ? (
        <p className="text-center py-16 text-gray-400">該当するストックがありません</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stocks.map((stock) => {
            const status = statusOf(stock);
            const isSaving = saving[stock.id];
            return (
              <div key={stock.id} className="rounded-2xl border p-4 flex flex-col gap-3"
                style={{ backgroundColor: '#252240', borderColor: '#3a3660' }}>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  <span className={`badge text-[11px] ${statusStyle(status)}`}>{status}</span>
                  <span className={`badge text-[11px] ${intentStyle(stock.intent)}`}>{stock.intent}</span>
                  {stock.priority_category && (
                    <span className={`badge text-[11px] ${priorityStyle(stock.priority_category)}`}>
                      {stock.priority_category}
                    </span>
                  )}
                </div>

                {/* Title */}
                <Link href={`/stocks/${stock.id}`} className="font-semibold text-gray-900 hover:text-brand-600 transition-colors leading-snug line-clamp-2 text-sm">
                  {stock.title}
                </Link>

                {/* Summary */}
                {stock.summary && (
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{stock.summary}</p>
                )}

                {/* Tags */}
                {stock.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {stock.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="badge bg-gray-100 text-gray-500 text-[10px]">{tag}</span>
                    ))}
                    {stock.tags.length > 3 && <span className="badge bg-gray-100 text-gray-400 text-[10px]">+{stock.tags.length - 3}</span>}
                  </div>
                )}

                {/* Status change + date */}
                <div className="flex items-center justify-between gap-2 border-t pt-2" style={{ borderColor: '#3a3660' }}>
                  <div className="flex items-center gap-2">
                    <select
                      value={status}
                      onChange={(e) => handleStatusChange(stock, e.target.value as LiteStatus)}
                      disabled={isSaving}
                      className="text-xs rounded-lg px-2 py-1 border"
                      style={{ backgroundColor: '#1f1d38', borderColor: '#4a4678', color: '#a8a4cc' }}
                    >
                      {STATUS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {isSaving && <span className="text-[10px] text-gray-400">保存中…</span>}
                  </div>
                  <span className="text-xs text-gray-300">{formatDate(stock.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
