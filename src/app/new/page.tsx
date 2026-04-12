'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Save, RotateCcw, ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import type { StockFormData, AnalysisResult, Intent, RelatedProject } from '@/types';
import { recommendBadgeStyle } from '@/lib/utils';

type PageState = 'form' | 'analyzing' | 'review' | 'saving';

const SOURCE_PLATFORMS = ['Claude', 'ChatGPT', 'Perplexity', 'Gemini', 'Memo'] as const;
const INTENTS: Intent[]          = ['商品化', '検討中', 'メモ'];
const RELATED_PROJECTS: RelatedProject[] = ['TrainerDocs', 'IdeaStock', 'その他'];

function intentStyle(v: string) {
  if (v === '商品化') return 'bg-green-100 text-green-700';
  if (v === '検討中')  return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-600';
}

function ScoreDots({ score }: { score: number }) {
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`w-2.5 h-2.5 rounded-full ${i <= score ? 'bg-brand-500' : 'bg-gray-200'}`} />
      ))}
      <span className="ml-1 text-sm text-gray-500">{score}/5</span>
    </div>
  );
}

function ToggleGroup<T extends string>({
  label, options, value, onChange, styleFor,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
  styleFor?: (v: string) => string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = opt === value;
          const base = styleFor ? styleFor(opt) : '';
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`badge cursor-pointer transition-all border ${
                active
                  ? `${base} ring-2 ring-offset-1 ring-brand-400 font-semibold`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function NewPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>('form');
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const [form, setForm] = useState<StockFormData>({
    title: '',
    source_platform: '',
    raw_text: '',
    human_note: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleAnalyze = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.source_platform) { setError('出所を選択してください'); return; }
    setState('analyzing');
    setError('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'AI分析に失敗しました');
      setAnalysis(data as AnalysisResult);
      setState('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析中にエラーが発生しました');
      setState('form');
    }
  };

  const handleSave = async () => {
    if (!analysis) return;
    setState('saving');
    setError('');

    try {
      const res = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ...analysis }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '保存に失敗しました');
      router.push('/stocks');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存中にエラーが発生しました');
      setState('review');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
            <span className={state === 'form' || state === 'analyzing' ? 'text-brand-600 font-medium' : ''}>入力</span>
            <ChevronRight size={14} />
            <span className={state === 'review' || state === 'saving' ? 'text-brand-600 font-medium' : ''}>AI分析結果を確認</span>
            <ChevronRight size={14} />
            <span className={state === 'saving' ? 'text-brand-600 font-medium' : ''}>保存</span>
          </div>

          {/* ── FORM ── */}
          {(state === 'form' || state === 'analyzing') && (
            <form onSubmit={handleAnalyze} className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
                <h1 className="text-xl font-bold text-gray-900">新規ストック登録</h1>

                <div>
                  <label className="form-label">タイトル <span className="text-red-500">*</span></label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="例：AIで契約書を自動生成するSaaSのアイデア"
                  />
                </div>

                <div>
                  <label className="form-label">出所 <span className="text-red-500">*</span></label>
                  <select name="source_platform" value={form.source_platform} onChange={handleChange} required className="form-select">
                    <option value="">選択してください</option>
                    {SOURCE_PLATFORMS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">本文（コピペ） <span className="text-red-500">*</span></label>
                  <textarea
                    name="raw_text"
                    value={form.raw_text}
                    onChange={handleChange}
                    required
                    rows={10}
                    className="form-textarea"
                    placeholder="AIとの会話ログ、メモ、アイデアなどをそのままペーストしてください"
                  />
                </div>

                <div>
                  <label className="form-label">一言メモ（任意）</label>
                  <input
                    name="human_note"
                    value={form.human_note}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="例：来月中に着手したい、競合調査が必要"
                  />
                </div>

                <p className="text-xs text-gray-400">
                  用途・関連プロジェクトは Claude が本文から自動判定します。確認画面で変更できます。
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
              )}

              <button type="submit" disabled={state === 'analyzing'} className="btn-primary w-full text-base py-4">
                {state === 'analyzing' ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Claude が分析中...</>
                ) : (
                  <><Sparkles size={18} />整理する</>
                )}
              </button>
            </form>
          )}

          {/* ── REVIEW ── */}
          {(state === 'review' || state === 'saving') && analysis && (
            <div className="space-y-6">
              {/* Entry summary */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-2">
                <span className="badge bg-brand-100 text-brand-700">{form.source_platform}</span>
                <h2 className="text-lg font-bold text-gray-900">{form.title}</h2>
                {form.human_note && (
                  <p className="text-sm text-gray-500 italic">「{form.human_note}」</p>
                )}
              </div>

              {/* AI analysis */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
                <div className="flex items-center gap-2 text-brand-700 font-semibold">
                  <Sparkles size={18} />AI分析結果
                </div>

                {/* Editable: intent + related_project */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-4 border-b border-gray-100">
                  <ToggleGroup
                    label="用途（変更可）"
                    options={INTENTS}
                    value={analysis.intent}
                    onChange={(v) => setAnalysis((prev) => prev ? { ...prev, intent: v } : prev)}
                    styleFor={intentStyle}
                  />
                  <ToggleGroup
                    label="関連PJ（変更可）"
                    options={RELATED_PROJECTS}
                    value={analysis.related_project}
                    onChange={(v) => setAnalysis((prev) => prev ? { ...prev, related_project: v } : prev)}
                  />
                </div>

                {/* Summary */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">要約</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{analysis.summary}</p>
                </div>

                {/* Tags */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">タグ</p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.tags.map((tag) => (
                      <span key={tag} className="badge bg-gray-100 text-gray-700">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Ideas */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">抽出アイデア</p>
                  <ul className="space-y-1.5">
                    {analysis.idea_list.map((idea, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-brand-400 font-bold mt-0.5">·</span>{idea}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Product formats */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">商品化の形</p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.product_formats.map((fmt) => (
                      <span key={fmt} className="badge bg-indigo-50 text-indigo-700 border border-indigo-100">{fmt}</span>
                    ))}
                  </div>
                </div>

                {/* Scores */}
                <div className="border-t border-gray-100 pt-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1.5">インパクト</p>
                      <ScoreDots score={analysis.impact_score} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1.5">実現難易度</p>
                      <ScoreDots score={analysis.difficulty_score} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1.5">継続性</p>
                      <ScoreDots score={analysis.continuity_score} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <span className={`text-2xl font-bold px-4 py-1.5 rounded-xl ${recommendBadgeStyle(analysis.recommend_score)}`}>
                      {analysis.recommend_score}点
                    </span>
                    <p className="text-sm text-gray-600 leading-relaxed">{analysis.recommend_reason}</p>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setState('form'); setAnalysis(null); }}
                  disabled={state === 'saving'}
                  className="btn-secondary flex-1"
                >
                  <RotateCcw size={16} />やり直す
                </button>
                <button onClick={handleSave} disabled={state === 'saving'} className="btn-primary flex-1">
                  {state === 'saving' ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />保存中...</>
                  ) : (
                    <><Save size={16} />保存する</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
