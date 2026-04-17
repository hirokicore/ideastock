'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Intent, PriorityCategory, TimeSlot } from '@/types';
import { DUMMY_STOCKS } from '@/lib/dummy';

type SortKey = 'created_at' | 'impact_score';

export default function StocksPage() {
  const [filterIntent, setFilterIntent] = useState<Intent | ''>('');
  const [filterPriority, setFilterPriority] = useState<PriorityCategory | ''>('');
  const [filterTimeSlot, setFilterTimeSlot] = useState<TimeSlot | ''>('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const router = useRouter();

  const filtered = useMemo(() => {
    let list = [...DUMMY_STOCKS];

    if (filterIntent) list = list.filter((s) => s.intent === filterIntent);
    if (filterPriority) list = list.filter((s) => s.priority_category === filterPriority);
    if (filterTimeSlot) list = list.filter((s) => s.time_slot === filterTimeSlot);

    list.sort((a, b) => {
      const av = sortKey === 'created_at' ? a.created_at : (a.impact_score ?? 0);
      const bv = sortKey === 'created_at' ? b.created_at : (b.impact_score ?? 0);
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [filterIntent, filterPriority, filterTimeSlot, sortKey, sortAsc]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>アイデア一覧</h1>
        <button
          onClick={() => router.push('/new')}
          style={{ padding: '7px 16px', fontSize: 13, cursor: 'pointer', background: '#111', color: '#fff', border: 'none', borderRadius: 6 }}
        >
          + 新規登録
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <label>
          Intent&nbsp;
          <select value={filterIntent} onChange={(e) => setFilterIntent(e.target.value as Intent | '')}>
            <option value="">すべて</option>
            <option value="商品化">商品化</option>
            <option value="検討中">検討中</option>
            <option value="メモ">メモ</option>
          </select>
        </label>

        <label>
          Priority&nbsp;
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as PriorityCategory | '')}>
            <option value="">すべて</option>
            <option value="今すぐ">今すぐ</option>
            <option value="仕込み">仕込み</option>
            <option value="挑戦">挑戦</option>
          </select>
        </label>

        <label>
          TimeSlot&nbsp;
          <select value={filterTimeSlot} onChange={(e) => setFilterTimeSlot(e.target.value as TimeSlot | '')}>
            <option value="">すべて</option>
            <option value="今月">今月</option>
            <option value="3ヶ月以内">3ヶ月以内</option>
            <option value="半年〜">半年〜</option>
            <option value="いつか">いつか</option>
          </select>
        </label>
      </div>

      {/* Sort */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <span style={{ fontSize: 13 }}>並び替え:</span>
        {(['created_at', 'impact_score'] as SortKey[]).map((k) => (
          <button
            key={k}
            onClick={() => {
              if (sortKey === k) setSortAsc((v) => !v);
              else { setSortKey(k); setSortAsc(false); }
            }}
            style={{
              padding: '4px 10px',
              fontSize: 13,
              cursor: 'pointer',
              background: sortKey === k ? '#333' : '#eee',
              color: sortKey === k ? '#fff' : '#333',
              border: 'none',
              borderRadius: 4,
            }}
          >
            {k === 'created_at' ? '登録日' : 'Impact'} {sortKey === k ? (sortAsc ? '↑' : '↓') : ''}
          </button>
        ))}
        <span style={{ fontSize: 12, color: '#888' }}>{filtered.length} 件</span>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((stock) => (
          <div
            key={stock.id}
            onClick={() => router.push(`/stocks/${stock.id}`)}
            style={{ border: '1px solid #ddd', borderRadius: 8, padding: '14px 16px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{stock.title}</h2>
              <span style={{ fontSize: 13, color: '#888', whiteSpace: 'nowrap', marginLeft: 12 }}>
                {stock.created_at.slice(0, 10)}
              </span>
            </div>

            <p style={{ fontSize: 13, color: '#444', margin: '6px 0 10px', lineHeight: 1.5 }}>
              {stock.summary}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {stock.tags.map((tag) => (
                <span
                  key={tag}
                  style={{ fontSize: 11, background: '#f0f0f0', borderRadius: 4, padding: '2px 6px' }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#555' }}>
              <span>Impact: <strong>{stock.impact_score ?? '—'}</strong></span>
              {stock.intent && <span>Intent: {stock.intent}</span>}
              {stock.priority_category && <span>Priority: {stock.priority_category}</span>}
              {stock.time_slot && <span>TimeSlot: {stock.time_slot}</span>}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p style={{ color: '#888', fontSize: 14 }}>該当するアイデアがありません。</p>
        )}
      </div>
    </div>
  );
}
