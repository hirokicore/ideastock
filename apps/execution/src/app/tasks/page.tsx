import Link from 'next/link';
import { ChevronRight, Circle, Loader, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import type { ExecutionTask, TimeSlot, TaskStatus } from '@/types';

const TIME_SLOTS: TimeSlot[] = ['今日', '今週', '今月', 'いつか'];

const STATUS_META: Record<TaskStatus, { label: string; icon: React.ReactNode; style: string }> = {
  todo:  { label: 'todo',  icon: <Circle size={14} />,       style: 'text-gray-400' },
  doing: { label: 'doing', icon: <Loader size={14} />,       style: 'text-blue-500' },
  done:  { label: 'done',  icon: <CheckCircle2 size={14} />, style: 'text-brand-500' },
};

function StatusIcon({ status }: { status: TaskStatus }) {
  const meta = STATUS_META[status];
  return <span className={meta.style}>{meta.icon}</span>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: tasks } = await supabase
    .from('execution_tasks')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  const all = (tasks ?? []) as ExecutionTask[];

  // Fetch plan_type for tasks that have source_plan_id
  const planIds = [...new Set(all.map((t) => t.source_plan_id).filter(Boolean))] as string[];
  const mvpPlanIds = new Set<string>();
  if (planIds.length > 0) {
    const { data: plans } = await supabase
      .from('business_plans')
      .select('id, plan_type')
      .in('id', planIds);
    (plans ?? []).forEach((p: { id: string; plan_type: string }) => {
      if (p.plan_type === 'mvp') mvpPlanIds.add(p.id);
    });
  }

  const grouped = TIME_SLOTS.reduce<Record<TimeSlot, ExecutionTask[]>>((acc, slot) => {
    acc[slot] = all.filter((t) => t.time_slot === slot);
    return acc;
  }, { '今日': [], '今週': [], '今月': [], 'いつか': [] });

  const totalDone = all.filter((t) => t.status === 'done').length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-8">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">タスク一覧</h1>
              {all.length > 0 && (
                <p className="text-sm text-gray-400 mt-0.5">{totalDone} / {all.length} 完了</p>
              )}
            </div>
          </div>

          {all.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-2">
              <p className="text-gray-400 text-sm">タスクがありません</p>
              <p className="text-gray-300 text-xs">事業計画サイトの詳細画面から「実行タスクを生成」してください</p>
            </div>
          ) : (
            <div className="space-y-8">
              {TIME_SLOTS.map((slot) => {
                const slotTasks = grouped[slot];
                if (slotTasks.length === 0) return null;
                const doneCnt = slotTasks.filter((t) => t.status === 'done').length;
                return (
                  <section key={slot}>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{slot}</h2>
                      <span className="text-xs text-gray-400">{doneCnt}/{slotTasks.length}</span>
                    </div>
                    <div className="space-y-2">
                      {slotTasks.map((task) => {
                        const isMvp = task.source_plan_id ? mvpPlanIds.has(task.source_plan_id) : false;
                        return (
                          <Link
                            key={task.id}
                            href={`/tasks/${task.id}`}
                            className={`bg-white rounded-2xl border p-4 flex items-center gap-3 hover:shadow-sm transition-all group ${
                              task.status === 'done'
                                ? 'border-gray-100 opacity-60'
                                : 'border-gray-200 hover:border-brand-300'
                            }`}
                          >
                            <StatusIcon status={task.status} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                {isMvp && (
                                  <span className="badge bg-brand-100 text-brand-700 text-[10px] px-1.5 py-0 leading-4">MVP</span>
                                )}
                                <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900 group-hover:text-brand-700'}`}>
                                  {task.title}
                                </p>
                              </div>
                              <p className="text-xs text-gray-400 truncate">{task.description}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-gray-300">{formatDate(task.created_at)}</span>
                              <ChevronRight size={15} className="text-gray-300 group-hover:text-brand-400 transition-colors" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
