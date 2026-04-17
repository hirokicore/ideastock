'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import type { Intent, PriorityCategory, TimeSlot } from '@/types';
import { DUMMY_STOCKS } from '@/lib/dummy';

const SCORE_LABELS: Record<string, string> = {
  impact_score: 'Impact',
  difficulty_score: 'Difficulty',
  continuity_score: 'Continuity',
  placement_score: 'Placement',
  mental_score: 'Mental',
  revenue_score: 'Revenue',
};

const SCORE_KEYS = Object.keys(SCORE_LABELS) as Array<keyof typeof SCORE_LABELS>;

export default function StockDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const stock = DUMMY_STOCKS.find((s) => s.id === id);

  const [intent, setIntent] = useState<Intent | ''>(stock?.intent ?? '');
  const [relatedProject, setRelatedProject] = useState(stock?.related_project ?? '');
  const [priorityCategory, setPriorityCategory] = useState<PriorityCategory | ''>(stock?.priority_category ?? '');
  const [timeSlot, setTimeSlot] = useState<TimeSlot | ''>(stock?.time_slot ?? '');
  const [saved, setSaved] = useState(false);

  if (!stock) {
    return (
      <div style={{ padding: 32, fontFamily: 'sans-serif' }}>
        <p>アイデアが見つかりませんでした（id: {id}）</p>
        <button onClick={() => router.back()} style={btnStyle}>← 戻る</button>
      </div>
    );
  }

  const handleSave = () => {
    // ダミー保存：実際にはAPIへPATCHする
    console.log('saved (dummy)', { id, intent, relatedProject, priorityCategory, timeSlot });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px', fontFamily: 'sans-serif' }}>
      <button onClick={() => router.push('/stocks')} style={{ ...btnStyle, marginBottom: 20 }}>
        ← 一覧へ
      </button>

      {/* Header */}
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{stock.title}</h1>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>登録日: {stock.created_at.slice(0, 10)}</p>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {stock.tags.map((tag) => (
          <span key={tag} style={tagStyle}>{tag}</span>
        ))}
      </div>

      {/* Summary */}
      <section style={sectionStyle}>
        <h2 style={sectionHeadStyle}>サマリー</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: '#333' }}>{stock.summary}</p>
      </section>

      {/* Scores */}
      <section style={sectionStyle}>
        <h2 style={sectionHeadStyle}>スコア</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {SCORE_KEYS.map((key) => {
            const val = stock[key as keyof typeof stock] as number | null;
            return (
              <div key={key} style={{ background: '#f7f7f7', borderRadius: 6, padding: '8px 12px' }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{SCORE_LABELS[key]}</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{val ?? '—'}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Planning form */}
      <section style={sectionStyle}>
        <h2 style={sectionHeadStyle}>プランニング</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={labelStyle}>
            Intent
            <select value={intent} onChange={(e) => setIntent(e.target.value as Intent | '')} style={selectStyle}>
              <option value="">未設定</option>
              <option value="商品化">商品化</option>
              <option value="検討中">検討中</option>
              <option value="メモ">メモ</option>
            </select>
          </label>

          <label style={labelStyle}>
            関連プロジェクト
            <input
              value={relatedProject}
              onChange={(e) => setRelatedProject(e.target.value)}
              placeholder="例: TrainerDocs"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Priority
            <select value={priorityCategory} onChange={(e) => setPriorityCategory(e.target.value as PriorityCategory | '')} style={selectStyle}>
              <option value="">未設定</option>
              <option value="今すぐ">今すぐ</option>
              <option value="仕込み">仕込み</option>
              <option value="挑戦">挑戦</option>
            </select>
          </label>

          <label style={labelStyle}>
            TimeSlot
            <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value as TimeSlot | '')} style={selectStyle}>
              <option value="">未設定</option>
              <option value="今月">今月</option>
              <option value="3ヶ月以内">3ヶ月以内</option>
              <option value="半年〜">半年〜</option>
              <option value="いつか">いつか</option>
            </select>
          </label>
        </div>

        <button onClick={handleSave} style={{ ...btnStyle, marginTop: 16, background: '#111', color: '#fff' }}>
          {saved ? '保存しました ✓' : '保存する（ダミー）'}
        </button>
      </section>

      {/* Related IDs */}
      <section style={sectionStyle}>
        <h2 style={sectionHeadStyle}>関連アイデア</h2>
        {stock.related_ids.length === 0 ? (
          <p style={{ fontSize: 13, color: '#aaa' }}>なし</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {stock.related_ids.map((rid) => (
              <li key={rid} style={{ fontSize: 13, marginBottom: 4 }}>
                <button
                  onClick={() => router.push(`/stocks/${rid}`)}
                  style={{ background: 'none', border: 'none', color: '#0070f3', cursor: 'pointer', padding: 0, fontSize: 13 }}
                >
                  ID: {rid}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// Styles
const btnStyle: React.CSSProperties = {
  padding: '6px 14px', fontSize: 13, cursor: 'pointer',
  background: '#eee', border: 'none', borderRadius: 4,
};
const tagStyle: React.CSSProperties = {
  fontSize: 11, background: '#f0f0f0', borderRadius: 4, padding: '2px 6px',
};
const sectionStyle: React.CSSProperties = {
  borderTop: '1px solid #eee', paddingTop: 16, marginTop: 16,
};
const sectionHeadStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#555',
};
const labelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13,
};
const selectStyle: React.CSSProperties = {
  padding: '6px 8px', fontSize: 13, borderRadius: 4, border: '1px solid #ccc',
};
const inputStyle: React.CSSProperties = {
  padding: '6px 8px', fontSize: 13, borderRadius: 4, border: '1px solid #ccc',
};
