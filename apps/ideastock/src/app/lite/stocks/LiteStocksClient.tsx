'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { IdeaStock, Intent, PriorityCategory } from '@/types';
import { formatDate } from '@/lib/utils';

// ──────────────────────────────────────────────
// Lite status (stored in localStorage)
// ──────────────────────────────────────────────
export type LiteStatus =
  | '未整理'
  | '軽処理済み'
  | '外部AI処理待ち'
  | '入力戻し待ち'
  | '詳細化済み'
  | '要修正';

const STATUS_LIST: LiteStatus[] = [
  '未整理', '軽処理済み', '外部AI処理待ち', '入力戻し待ち', '詳細化済み', '要修正',
];

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

const LS_KEY = 'ideastock_lite_status';

function loadStatuses(): Record<string, LiteStatus> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}'); } catch { return {}; }
}

function saveStatuses(m: Record<string, LiteStatus>) {
  localStorage.setItem(LS_KEY, JSON.stringify(m));
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
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

export default function LiteStocksClient({ initialStocks }: { initialStocks: IdeaStock[] }) {
  const [statuses, setStatuses] = useState<Record<string, LiteStatus>>({});
  const [filterStatus, setFilterStatus] = useState<LiteStatus | 'すべて'>('すべて');
  const [filterIntent, setFilterIntent] = useState<Intent | 'すべて'>('すべて');

  useEffect(() => { setStatuses(loadStatuses()); }, []);

  const setStatus = (id: string, s: LiteStatus) => {
    setStatuses((prev) => {
      const next = { ...prev, [id]: s };
      saveStatuses(next);
      return next;
    });
  };

  const statusOf = (id: string): LiteStatus => statuses[id] ?? '未整理';

  const stocks = useMemo(() => {
    let list = [...initialStocks];
    if (filterStatus !== 'すべて') list = list.filter((s) => statusOf(s.id) === filterStatus);
    if (filterIntent !== 'すべて') list = list.filter((s) => s.intent === filterIntent);
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStocks, filterStatus, filterIntent, statuses]);

  // Status counts
  const counts = useMemo(() => {
    const m: Partial<Record<LiteStatus | 'すべて', number>> = { 'すべて': initialStocks.length };
    for (const s of STATUS_LIST) {
      m[s] = initialStocks.filter((st) => statusOf(st.id) === s).length;
    }
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStocks, statuses]);

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
            const status = statusOf(stock.id);
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
                  <select
                    value={status}
                    onChange={(e) => setStatus(stock.id, e.target.value as LiteStatus)}
                    className="text-xs rounded-lg px-2 py-1 border"
                    style={{ backgroundColor: '#1f1d38', borderColor: '#4a4678', color: '#a8a4cc' }}
                  >
                    {STATUS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
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
