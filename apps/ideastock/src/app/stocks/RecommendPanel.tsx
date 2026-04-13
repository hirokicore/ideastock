'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Sparkles, ChevronRight } from 'lucide-react';

type Recommendation = {
  id: string;
  title: string;
  summary: string | null;
  reason: string;
};

export default function RecommendPanel() {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '推薦に失敗しました');
      setResults(data.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100 rounded-2xl p-5 mb-6 space-y-4">
      <div className="flex items-center gap-2 text-brand-700 font-semibold text-sm">
        <Sparkles size={16} />
        今日やりたいことから推薦
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="例：短時間で成果が出るものに着手したい、TrainerDocsを前進させたい…"
          className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-brand-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={loading || !goal.trim()}
          className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors flex-shrink-0"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles size={15} />
          )}
          推薦を見る
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {results && results.length > 0 && (
        <div className="space-y-3 pt-1">
          {results.map((rec, i) => (
            <Link
              key={rec.id}
              href={`/stocks/${rec.id}`}
              className="flex items-start gap-3 bg-white rounded-xl border border-brand-100 p-4 hover:border-brand-300 hover:shadow-sm transition-all group"
            >
              <span className="text-lg font-bold text-brand-300 flex-shrink-0 w-5 mt-0.5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm leading-snug">{rec.title}</p>
                <p className="text-xs text-brand-600 mt-1 leading-relaxed">{rec.reason}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-400 flex-shrink-0 mt-1 transition-colors" />
            </Link>
          ))}
        </div>
      )}

      {results && results.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-2">推薦できるストックが見つかりませんでした</p>
      )}
    </div>
  );
}
