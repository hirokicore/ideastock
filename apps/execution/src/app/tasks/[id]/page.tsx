import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import TaskDetail from './TaskDetail';
import type { ExecutionTask } from '@/types';

const TIME_SLOT_STYLES: Record<string, string> = {
  '今日': 'bg-red-100 text-red-700',
  '今週': 'bg-orange-100 text-orange-700',
  '今月': 'bg-yellow-100 text-yellow-700',
  'いつか': 'bg-gray-100 text-gray-600',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('execution_tasks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single();

  if (error || !data) notFound();

  const task = data as ExecutionTask;
  const bp = process.env.NEXT_PUBLIC_BUSINESS_PLAN_URL ?? 'http://localhost:3001';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-6">

          <Link href="/tasks" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={15} />タスク一覧に戻る
          </Link>

          {/* Header card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
            <div className="flex items-start gap-3">
              <span className={`badge flex-shrink-0 mt-0.5 ${TIME_SLOT_STYLES[task.time_slot] ?? 'bg-gray-100 text-gray-600'}`}>
                <Calendar size={10} className="mr-1" />{task.time_slot}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
            <p className="text-xs text-gray-400">{formatDate(task.created_at)}</p>

            {task.description && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-1.5">
                  <FileText size={12} />やること
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{task.description}</p>
              </div>
            )}

            {task.source_plan_id && (
              <a
                href={`${bp}/plans/${task.source_plan_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 transition-colors"
              >
                元の事業計画を見る →
              </a>
            )}
          </div>

          <TaskDetail task={task} />

        </div>
      </main>
    </div>
  );
}
