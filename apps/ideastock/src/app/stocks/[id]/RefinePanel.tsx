'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gem, Loader2, Save, X, TrendingUp, Wrench, RefreshCw, ArrowRight } from 'lucide-react';
import type { RefineResult } from '@/types';

type State = 'idle' | 'loading' | 'result' | 'saving';

function ScoreChange({ label, before, after }: { label: string; before?: number | null; after: number }) {
  const diff = after - (before ?? 0);
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500 w-20">{label}</span>
      <span className="tabular-nums text-gray-400">{before ?? '?'}</span>
      <ArrowRight size={12} className="text-gray-400" />
      <span className={`tabular-nums font-bold ${diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-400' : 'text-gray-400'}`}>
        {after}
      </span>
      {diff !== 0 && (
        <span className={`text-xs ${diff > 0 ? 'text-green-500' : 'text-red-400'}`}>
          ({diff > 0 ? '+' : ''}{diff})
        </span>
      )}
    </div>
  );
}

export default function RefinePanel({
  stockId,
  stockTitle,
  sourcePlatform,
  rawText,
  currentScores,
}: {
  stockId: string;
  stockTitle: string;
  sourcePlatform: string;
  rawText: string;
  currentScores: {
    impact?: number | null;
    difficulty?: number | null;
    continuity?: number | null;
    recommend?: number | null;
  };
}) {
  const router = useRouter();
  const [state, setState] = useState<State>('idle');
  const [result, setResult] = useState<RefineResult | null>(null);
  const [error, setError] = useState('');

  const handleRefine = async () => {
    setState('loading');
    setError('');
    try {
      const res = await fetch(`/api/stocks/${stockId}/refine`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '改善に失敗しました');
      setResult(data as RefineResult);
      setState('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setState('idle');
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setState('saving');
    setError('');

    const newRawText = `[改善版アイデア]\n${result.improved_summary}\n\n[改善ポイント]\n市場性: ${result.market_improvement}\n実現性: ${result.feasibility_improvement}\n継続性: ${result.continuity_improvement}\n\n[主な変更点]\n${result.key_changes.map((c) => `・${c}`).join('\n')}\n\n[元アイデア: ${stockTitle}]\n${rawText}`;

    try {
      const res = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: result.new_title,
          source_platform: sourcePlatform,
          raw_text: newRawText,
          human_note: `[改善版] 元: ${stockTitle}`,
          intent: '商品化',
          related_project: 'IdeaStock',
          summary: result.summary,
          tags: result.tags,
          idea_list: result.idea_list,
          product_formats: result.product_formats,
          impact_score: result.impact_score,
          difficulty_score: result.difficulty_score,
          continuity_score: result.continuity_score,
          recommend_score: result.recommend_score,
          recommend_reason: result.recommend_reason,
          priority_category: result.priority_category,
          time_slot: result.time_slot,
          spread_score: result.spread_score,
          cost_score: result.cost_score,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '保存に失敗しました');
      router.push(`/stocks/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
      setState('result');
    }
  };

  if (state === 'idle') {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <button
          onClick={handleRefine}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all"
          style={{ background: 'linear-gradient(135deg, #4d449e, #7058c0)', color: '#fff' }}
        >
          <Gem size={16} />
          このアイデアを限界まで磨く
        </button>
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <Loader2 size={28} className="animate-spin text-brand-400" />
        <p className="text-sm text-gray-500">Claudeが3軸で分析・改善中...</p>
      </div>
    );
  }

  if ((state === 'result' || state === 'saving') && result) {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-400 font-bold text-sm">
            <Gem size={16} />
            改善版アイデア
          </div>
          <button
            onClick={() => { setState('idle'); setResult(null); }}
            disabled={state === 'saving'}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* New title */}
        <div>
          <p className="text-xs text-gray-500 mb-1">改善版タイトル</p>
          <p className="font-bold text-lg leading-snug" style={{ color: '#e4e2f2' }}>
            {result.new_title}
          </p>
        </div>

        {/* Improved summary */}
        <div>
          <p className="text-xs text-gray-500 mb-1">改善後の要約</p>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#c4c0e4' }}>
            {result.improved_summary}
          </p>
        </div>

        {/* 3-axis improvements */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl p-4 space-y-2" style={{ background: '#1f2e20' }}>
            <div className="flex items-center gap-1.5 text-xs font-bold text-green-400">
              <TrendingUp size={13} />市場性
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#a8c8a8' }}>{result.market_improvement}</p>
          </div>
          <div className="rounded-xl p-4 space-y-2" style={{ background: '#1e2230' }}>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
              <Wrench size={13} />実現性
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#a8b8d8' }}>{result.feasibility_improvement}</p>
          </div>
          <div className="rounded-xl p-4 space-y-2" style={{ background: '#231e30' }}>
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
              <RefreshCw size={13} />継続性
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#c0a8d8' }}>{result.continuity_improvement}</p>
          </div>
        </div>

        {/* Key changes */}
        <div>
          <p className="text-xs text-gray-500 mb-2">主な変更点</p>
          <ul className="space-y-1.5">
            {result.key_changes.map((change, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#c4c0e4' }}>
                <span className="text-brand-400 font-bold mt-0.5 flex-shrink-0">→</span>
                {change}
              </li>
            ))}
          </ul>
        </div>

        {/* Score changes */}
        <div className="rounded-xl p-4 space-y-2" style={{ background: '#1f1d38' }}>
          <p className="text-xs text-gray-500 mb-2">スコア変化</p>
          <ScoreChange label="インパクト" before={currentScores.impact} after={result.impact_score} />
          <ScoreChange label="難易度" before={currentScores.difficulty} after={result.difficulty_score} />
          <ScoreChange label="継続性" before={currentScores.continuity} after={result.continuity_score} />
          <div className="border-t border-gray-700 pt-2 mt-2">
            <ScoreChange label="総合" before={currentScores.recommend} after={result.recommend_score} />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        {/* Actions */}
        <button
          onClick={handleSave}
          disabled={state === 'saving'}
          className="btn-primary w-full"
        >
          {state === 'saving' ? (
            <><Loader2 size={16} className="animate-spin" />保存中...</>
          ) : (
            <><Save size={16} />改善版としてストックに保存</>
          )}
        </button>
      </div>
    );
  }

  return null;
}
