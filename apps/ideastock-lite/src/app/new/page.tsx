'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AnalyzeLiteResult, IdeaStockLite } from '@/types';

type Step = 'input' | 'analyzing' | 'confirm' | 'saved';

// ダミー分析関数（将来 /api/analyze に置き換え）
async function dummyAnalyze(text: string): Promise<AnalyzeLiteResult> {
  await new Promise((r) => setTimeout(r, 1400)); // 擬似遅延
  return {
    title: text.slice(0, 30) + (text.length > 30 ? '…' : ''),
    summary: `「${text.slice(0, 40)}」をもとに自動生成されたサマリーです。`,
    tags: ['自動タグA', '自動タグB'],
    impact_score: 4,
    difficulty_score: 3,
    continuity_score: 4,
    placement_score: 3,
    mental_score: 4,
    revenue_score: 3,
  };
}

const SCORE_LABELS: [keyof AnalyzeLiteResult, string][] = [
  ['impact_score', 'Impact'],
  ['difficulty_score', 'Difficulty'],
  ['continuity_score', 'Continuity'],
  ['placement_score', 'Placement'],
  ['mental_score', 'Mental'],
  ['revenue_score', 'Revenue'],
];

export default function NewPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('input');
  const [rawText, setRawText] = useState('');
  const [result, setResult] = useState<AnalyzeLiteResult | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!rawText.trim()) { setError('テキストを入力してください'); return; }
    setError('');
    setStep('analyzing');
    const res = await dummyAnalyze(rawText);
    setResult(res);
    setStep('confirm');
  };

  const handleSave = () => {
    if (!result) return;
    // ダミー保存（将来 /api/stocks POST に置き換え）
    const newStock: IdeaStockLite = {
      id: String(Date.now()),
      user_id: 'dummy',
      created_at: new Date().toISOString(),
      raw_text: rawText,
      human_note: null,
      source_platform: 'Memo',
      intent: null,
      related_project: null,
      priority_category: null,
      time_slot: null,
      related_ids: [],
      ...result,
    };
    console.log('saved (dummy)', newStock);
    setStep('saved');
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px', fontFamily: 'sans-serif' }}>
      <button onClick={() => router.push('/stocks')} style={btnSecStyle}>← 一覧へ</button>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '16px 0 24px' }}>新しいアイデアを登録</h1>

      {/* ── STEP: input ── */}
      {step === 'input' && (
        <div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="アイデアや思いついたことをそのまま貼り付けてください…"
            rows={8}
            style={{ width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 6, border: '1px solid #ccc', resize: 'vertical', boxSizing: 'border-box' }}
          />
          {error && <p style={{ color: '#c00', fontSize: 13, marginTop: 4 }}>{error}</p>}
          <button onClick={handleAnalyze} style={{ ...btnPriStyle, marginTop: 12 }}>
            分析する →
          </button>
        </div>
      )}

      {/* ── STEP: analyzing ── */}
      {step === 'analyzing' && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p style={{ fontSize: 14, color: '#555' }}>AIが分析中です…</p>
        </div>
      )}

      {/* ── STEP: confirm ── */}
      {step === 'confirm' && result && (
        <div>
          <h2 style={sectionHeadStyle}>分析結果を確認</h2>

          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>タイトル</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{result.title}</div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>サマリー</div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>{result.summary}</div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>タグ</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {result.tags.map((t) => (
                <span key={t} style={tagStyle}>{t}</span>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>スコア</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {SCORE_LABELS.map(([key, label]) => (
                <div key={key} style={{ background: '#f7f7f7', borderRadius: 6, padding: '8px 12px' }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{result[key] as number}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={() => setStep('input')} style={btnSecStyle}>← やり直す</button>
            <button onClick={handleSave} style={btnPriStyle}>保存する（ダミー）</button>
          </div>
        </div>
      )}

      {/* ── STEP: saved ── */}
      {step === 'saved' && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>保存しました！</p>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
            ※ダミー保存のため、リロードすると消えます。
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => { setStep('input'); setRawText(''); setResult(null); }} style={btnSecStyle}>
              続けて登録
            </button>
            <button onClick={() => router.push('/stocks')} style={btnPriStyle}>
              一覧を見る
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const btnPriStyle: React.CSSProperties = {
  padding: '8px 18px', fontSize: 14, cursor: 'pointer',
  background: '#111', color: '#fff', border: 'none', borderRadius: 6,
};
const btnSecStyle: React.CSSProperties = {
  padding: '6px 14px', fontSize: 13, cursor: 'pointer',
  background: '#eee', border: 'none', borderRadius: 4,
};
const sectionHeadStyle: React.CSSProperties = {
  fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#333',
};
const cardStyle: React.CSSProperties = {
  border: '1px solid #eee', borderRadius: 8, padding: '12px 14px', marginBottom: 10,
};
const tagStyle: React.CSSProperties = {
  fontSize: 11, background: '#f0f0f0', borderRadius: 4, padding: '2px 8px',
};
