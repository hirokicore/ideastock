'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Save, RotateCcw, ChevronRight, GitMerge, Link2, PlusCircle, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import type { StockFormData, AnalysisResult, Intent, RelatedProject, OperationType, SimilarCandidate } from '@/types';
import { recommendBadgeStyle } from '@/lib/utils';

type PageState = 'form' | 'analyzing' | 'review' | 'checking' | 'saving';
type MergeChoice = 'merge' | 'link' | 'new';

const SOURCE_PLATFORMS = ['Claude', 'ChatGPT', 'Perplexity', 'Gemini', 'Memo'] as const;
const INTENTS: Intent[]             = ['商品化', '検討中', 'メモ'];
const RELATED_PROJECTS: RelatedProject[] = ['TrainerDocs', 'IdeaStock', 'その他'];
const OPERATION_TYPES: OperationType[] = ['放置型', '営業型', 'ハイブリッド'];

function intentStyle(v: string) {
  if (v === '商品化') return 'bg-green-100 text-green-700';
  if (v === '検討中')  return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-600';
}

function operationTypeStyle(v: string) {
  if (v === '放置型')    return 'bg-emerald-100 text-emerald-700';
  if (v === '営業型')    return 'bg-orange-100 text-orange-700';
  if (v === 'ハイブリッド') return 'bg-sky-100 text-sky-700';
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

function ChoiceButton({ value, current, onChange, icon, label, desc, color }: {
  value: MergeChoice;
  current: MergeChoice;
  onChange: (v: MergeChoice) => void;
  icon: React.ReactNode;
  label: string;
  desc: string;
  color: string;
}) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border text-xs transition-all ${
        active ? `${color} ring-2 ring-offset-1 ring-brand-400` : 'border-gray-200 text-gray-500 hover:border-gray-300'
      }`}
    >
      {icon}
      <span className="font-semibold">{label}</span>
      <span className="text-center leading-snug opacity-70">{desc}</span>
    </button>
  );
}

export default function NewPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>('form');
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Similarity state
  const [similarCandidates, setSimilarCandidates] = useState<SimilarCandidate[]>([]);
  const [mergeChoices, setMergeChoices] = useState<Record<string, MergeChoice>>({});
  const [similarChecked, setSimilarChecked] = useState(false);
  const [similarError, setSimilarError] = useState('');

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
      const result = data as AnalysisResult;
      setAnalysis(result);
      setSimilarChecked(false);
      setSimilarCandidates([]);
      setMergeChoices({});
      setSimilarError('');
      setState('checking');

      // Auto-check similarity
      try {
        const simRes = await fetch('/api/stocks/similar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            summary: result.summary,
            tags: result.tags,
          }),
        });
        const simData = await simRes.json();
        if (!simRes.ok) {
          setSimilarError(simData.error ?? '類似チェックに失敗しました');
        } else {
          const candidates: SimilarCandidate[] = simData.candidates ?? [];
          setSimilarCandidates(candidates);
          // Default: all candidates → 'new'
          const defaults: Record<string, MergeChoice> = {};
          candidates.forEach((c) => {
            defaults[c.id] = c.similarity_type === 'duplicate' ? 'merge' : 'link';
          });
          setMergeChoices(defaults);
        }
      } catch (err) {
        setSimilarError(err instanceof Error ? err.message : '類似チェックでエラーが発生しました');
      } finally {
        setSimilarChecked(true);
        setState('review');
      }
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
      const mergeTarget = similarCandidates.find((c) => mergeChoices[c.id] === 'merge');
      const linkTargets = similarCandidates.filter((c) => mergeChoices[c.id] === 'link');

      if (mergeTarget) {
        // Merge: send new idea as variation to existing stock
        const mergeRes = await fetch(`/api/stocks/${mergeTarget.id}/merge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            summary: analysis.summary,
            idea_list: analysis.idea_list,
          }),
        });
        const mergeData = await mergeRes.json();
        if (!mergeRes.ok) throw new Error(mergeData.error ?? '統合に失敗しました');
        router.push(`/stocks/${mergeTarget.id}`);
        return;
      }

      // Save new stock
      const res = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ...analysis }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '保存に失敗しました');

      const newId: string = data.id;

      // Link candidates marked as 'link'
      await Promise.all(
        linkTargets.map((c) =>
          fetch(`/api/stocks/${newId}/link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ link_id: c.id }),
          })
        )
      );

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
            <span className={state === 'review' || state === 'saving' || state === 'checking' ? 'text-brand-600 font-medium' : ''}>AI分析結果を確認</span>
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

          {/* ── CHECKING (similarity in progress) ── */}
          {state === 'checking' && (
            <div className="flex flex-col items-center gap-4 py-16 text-gray-500">
              <Loader2 size={32} className="animate-spin text-brand-400" />
              <p className="text-sm">類似アイデアを確認中...</p>
            </div>
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

              {/* Similar check error */}
              {similarChecked && similarError && (
                <div className="bg-white rounded-2xl border border-red-200 p-4">
                  <p className="text-xs text-red-500">類似チェックエラー: {similarError}</p>
                </div>
              )}

              {/* Similar candidates */}
              {similarChecked && !similarError && similarCandidates.length > 0 && (
                <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 space-y-4">
                  <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm">
                    <GitMerge size={16} />
                    類似アイデア候補
                  </div>
                  <p className="text-xs text-gray-500">既存ストックと類似している可能性があります。各候補への対応を選んでください。</p>

                  <div className="space-y-4">
                    {similarCandidates.map((candidate) => (
                      <div key={candidate.id} className="rounded-xl border border-gray-100 p-4 space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`badge text-xs ${candidate.similarity_type === 'duplicate' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                              {candidate.similarity_type === 'duplicate' ? '統合候補' : '関連候補'}
                            </span>
                            <a
                              href={`/stocks/${candidate.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-gray-800 hover:text-brand-600 transition-colors"
                            >
                              {candidate.title}
                            </a>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{candidate.reason}</p>
                        </div>

                        <div className="flex gap-2">
                          <ChoiceButton
                            value="merge"
                            current={mergeChoices[candidate.id] ?? 'new'}
                            onChange={(v) => setMergeChoices((prev) => ({ ...prev, [candidate.id]: v }))}
                            icon={<GitMerge size={14} />}
                            label="A: 統合"
                            desc="新規は保存せず既存へ"
                            color="bg-red-50 text-red-600 border-red-200"
                          />
                          <ChoiceButton
                            value="link"
                            current={mergeChoices[candidate.id] ?? 'new'}
                            onChange={(v) => setMergeChoices((prev) => ({ ...prev, [candidate.id]: v }))}
                            icon={<Link2 size={14} />}
                            label="B: 関連付け"
                            desc="両方保存して紐付け"
                            color="bg-blue-50 text-blue-600 border-blue-200"
                          />
                          <ChoiceButton
                            value="new"
                            current={mergeChoices[candidate.id] ?? 'new'}
                            onChange={(v) => setMergeChoices((prev) => ({ ...prev, [candidate.id]: v }))}
                            icon={<PlusCircle size={14} />}
                            label="C: 新規"
                            desc="別々に登録"
                            color="bg-gray-100 text-gray-600 border-gray-200"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {similarCandidates.some((c) => mergeChoices[c.id] === 'merge') && (
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                      「統合」を選択すると、新規ストックは保存されず既存ストックのページに移動します。
                    </p>
                  )}
                </div>
              )}

              {/* AI analysis */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
                <div className="flex items-center gap-2 text-brand-700 font-semibold">
                  <Sparkles size={18} />AI分析結果
                </div>

                {/* Editable: intent + related_project + operation_type */}
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
                  <ToggleGroup
                    label="運用タイプ（変更可）"
                    options={OPERATION_TYPES}
                    value={analysis.operation_type}
                    onChange={(v) => setAnalysis((prev) => prev ? { ...prev, operation_type: v } : prev)}
                    styleFor={operationTypeStyle}
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
                  onClick={() => { setState('form'); setAnalysis(null); setSimilarCandidates([]); setSimilarError(''); }}
                  disabled={state === 'saving'}
                  className="btn-secondary flex-1"
                >
                  <RotateCcw size={16} />やり直す
                </button>
                <button onClick={handleSave} disabled={state === 'saving'} className="btn-primary flex-1">
                  {state === 'saving' ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />保存中...</>
                  ) : similarCandidates.some((c) => mergeChoices[c.id] === 'merge') ? (
                    <><GitMerge size={16} />バリエーションとして統合</>
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
