'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, GitMerge, Link2, PlusCircle, Check, X } from 'lucide-react';
import type { SimilarCandidate } from '@/types';

type State = 'idle' | 'loading' | 'result' | 'saving';
type MergeChoice = 'merge' | 'link' | 'skip';

function ChoiceButton({ value, current, onChange, icon, label, color }: {
  value: MergeChoice;
  current: MergeChoice;
  onChange: (v: MergeChoice) => void;
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
        active ? `${color} ring-2 ring-offset-1 ring-brand-400` : 'border-gray-200 text-gray-400 hover:border-gray-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function SimilarPanel({
  stockId,
  title,
  summary,
  tags,
  alreadyLinkedIds,
}: {
  stockId: string;
  title: string;
  summary: string | null;
  tags: string[];
  alreadyLinkedIds: string[];
}) {
  const router = useRouter();
  const [state, setState] = useState<State>('idle');
  const [candidates, setCandidates] = useState<SimilarCandidate[]>([]);
  const [choices, setChoices] = useState<Record<string, MergeChoice>>({});
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setState('loading');
    setError('');
    try {
      const res = await fetch('/api/stocks/similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, summary: summary ?? '', tags }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '類似検索に失敗しました');

      // Exclude already-linked stocks
      const filtered: SimilarCandidate[] = (data.candidates ?? []).filter(
        (c: SimilarCandidate) => !alreadyLinkedIds.includes(c.id) && c.id !== stockId
      );

      setCandidates(filtered);

      // Smart defaults: duplicate→merge, related→link
      const defaults: Record<string, MergeChoice> = {};
      filtered.forEach((c) => {
        defaults[c.id] = c.similarity_type === 'duplicate' ? 'merge' : 'link';
      });
      setChoices(defaults);
      setState('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setState('idle');
    }
  };

  const handleApply = async () => {
    setState('saving');
    setError('');
    try {
      const toLink = candidates.filter((c) => choices[c.id] === 'merge' || choices[c.id] === 'link');
      await Promise.all(
        toLink.map((c) =>
          fetch(`/api/stocks/${stockId}/link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ link_id: c.id }),
          })
        )
      );
      router.refresh();
      setState('idle');
      setCandidates([]);
      setChoices({});
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
      setState('result');
    }
  };

  if (state === 'idle') {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <button
          onClick={handleSearch}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:border-brand-400 hover:text-brand-600 transition-all"
        >
          <Search size={15} />
          類似アイデアを探す
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <Loader2 size={24} className="animate-spin text-brand-400" />
        <p className="text-sm text-gray-500">類似アイデアを検索中...</p>
      </div>
    );
  }

  if ((state === 'result' || state === 'saving') && candidates.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <p className="text-sm text-gray-400">類似するアイデアは見つかりませんでした</p>
        <button
          onClick={() => setState('idle')}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          閉じる
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-600">
          <Search size={15} />
          類似アイデア候補
        </div>
        <button
          onClick={() => { setState('idle'); setCandidates([]); }}
          disabled={state === 'saving'}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Candidates */}
      <div className="space-y-3">
        {candidates.map((c) => (
          <div key={c.id} className="rounded-xl border border-gray-100 p-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`badge text-xs ${c.similarity_type === 'duplicate' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                  {c.similarity_type === 'duplicate' ? '統合候補' : '関連候補'}
                </span>
                <a
                  href={`/stocks/${c.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-gray-800 hover:text-brand-600 transition-colors truncate"
                >
                  {c.title}
                </a>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{c.reason}</p>
            </div>

            <div className="flex gap-2">
              <ChoiceButton
                value="merge"
                current={choices[c.id] ?? 'skip'}
                onChange={(v) => setChoices((prev) => ({ ...prev, [c.id]: v }))}
                icon={<GitMerge size={12} />}
                label="A: 統合"
                color="bg-red-50 text-red-600 border-red-200"
              />
              <ChoiceButton
                value="link"
                current={choices[c.id] ?? 'skip'}
                onChange={(v) => setChoices((prev) => ({ ...prev, [c.id]: v }))}
                icon={<Link2 size={12} />}
                label="B: 関連付け"
                color="bg-blue-50 text-blue-600 border-blue-200"
              />
              <ChoiceButton
                value="skip"
                current={choices[c.id] ?? 'skip'}
                onChange={(v) => setChoices((prev) => ({ ...prev, [c.id]: v }))}
                icon={<PlusCircle size={12} />}
                label="C: スキップ"
                color="bg-gray-100 text-gray-500 border-gray-200"
              />
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={handleApply}
        disabled={state === 'saving' || candidates.every((c) => choices[c.id] === 'skip')}
        className="btn-primary w-full"
      >
        {state === 'saving' ? (
          <><Loader2 size={15} className="animate-spin" />保存中...</>
        ) : (
          <><Check size={15} />適用する</>
        )}
      </button>
    </div>
  );
}
