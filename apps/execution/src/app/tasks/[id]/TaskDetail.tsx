'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Circle, Loader, CheckCircle2, Save, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { ExecutionTask, TaskStatus } from '@/types';

const STATUS_OPTIONS: { value: TaskStatus; label: string; icon: React.ReactNode; style: string }[] = [
  { value: 'todo',  label: 'Todo',  icon: <Circle size={15} />,       style: 'border-gray-200 text-gray-500' },
  { value: 'doing', label: 'Doing', icon: <Loader size={15} />,       style: 'border-blue-300 text-blue-600 bg-blue-50' },
  { value: 'done',  label: 'Done',  icon: <CheckCircle2 size={15} />, style: 'border-brand-300 text-brand-600 bg-brand-50' },
];

export default function TaskDetail({ task }: { task: ExecutionTask }) {
  const router = useRouter();
  const [status,   setStatus]   = useState<TaskStatus>(task.status);
  const [result,   setResult]   = useState(task.result ?? '');
  const [learning, setLearning] = useState(task.learning ?? '');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [saved,    setSaved]    = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('execution_tasks')
      .update({ status, result, learning })
      .eq('id', task.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Status selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ステータス</p>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatus(opt.value); setSaved(false); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                status === opt.value ? opt.style : 'border-gray-100 text-gray-400 hover:border-gray-200'
              }`}
            >
              {opt.icon}{opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result & Learning (shown when doing or done) */}
      {(status === 'doing' || status === 'done') && (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2">
            <label className="form-label">実行結果メモ</label>
            <textarea
              value={result}
              onChange={(e) => { setResult(e.target.value); setSaved(false); }}
              rows={4}
              className="form-textarea"
              placeholder="何をやったか、何が起きたか..."
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2">
            <label className="form-label">気づき・次に活かすこと</label>
            <textarea
              value={learning}
              onChange={(e) => { setLearning(e.target.value); setSaved(false); }}
              rows={4}
              className="form-textarea"
              placeholder="学んだこと、改善点、次のアクション..."
            />
          </div>
        </>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full py-4 text-base"
      >
        {saving ? (
          <><Loader2 size={16} className="animate-spin" />保存中...</>
        ) : saved ? (
          <><CheckCircle2 size={16} />保存しました</>
        ) : (
          <><Save size={16} />保存する</>
        )}
      </button>
    </div>
  );
}
