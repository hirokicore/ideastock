'use client';

import { useState } from 'react';
import { Zap, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';

export default function GenerateTasksButton({
  planId,
  executionUrl,
}: {
  planId: string;
  executionUrl: string;
}) {
  const [state, setState] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setState('generating');
    setError('');

    try {
      const res = await fetch('/api/tasks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId }),
      });
      const data = await res.json() as { count?: number; error?: string };
      if (data.error) { setError(data.error); setState('error'); return; }
      setCount(data.count ?? 0);
      setState('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'タスク生成に失敗しました');
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex items-center gap-2 flex-1 px-4 py-3 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 text-sm font-medium">
          <CheckCircle2 size={16} />
          {count}件のタスクを生成しました
        </div>
        <a
          href={executionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          <ExternalLink size={15} />タスクを見る
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleGenerate}
        disabled={state === 'generating'}
        className="flex items-center justify-center gap-2 w-full py-4 px-4 rounded-2xl border border-brand-300 text-brand-600 font-semibold text-base hover:bg-brand-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === 'generating' ? (
          <><Loader2 size={18} className="animate-spin" />タスク生成中...</>
        ) : (
          <><Zap size={18} />実行タスクを生成</>
        )}
      </button>
      {state === 'error' && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      )}
    </div>
  );
}
