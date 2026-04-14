import Link from 'next/link';
import { ChevronRight, Circle, Loader, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import type { ExecutionTask, TimeSlot, TaskStatus } from '@/types';

const TIME_SLOTS: TimeSlot[] = ['今日', '今週', '今月', 'いつか'];

const STATUS_META: Record<TaskStatus, { icon: React.ReactNode; style: string }> = {
  todo:  { icon: <Circle size={14} />,       style: 'text-gray-400' },
  doing: { icon: <Loader size={14} />,       style: 'text-blue-500' },
  done:  { icon: <CheckCircle2 size={14} />, style: 'text-brand-500' },
};

function StatusIcon({ status }: { status: TaskStatus }) {
  const { icon, style } = STATUS_META[status];
  return <span className={style}>{icon}</span>;
}

function MentalWeightBadge({ weight }: { weight: number | null | undefined }) {
  if (weight == null) return null;
  if (weight === 1) return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">軽</span>;
  if (weight === 2) return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700">中</span>;
  return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">重</span>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

type PlanInfo = { id: string; title: string; plan_type: string };

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: tasks } = await supabase
    .from('execution_tasks')
    .select('*')
    .eq('user_id', user!.id)
    .order('mental_weight', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  const all = (tasks ?? []) as ExecutionTask[];

  // Fetch plan info for all source_plan_ids
  const planIds = Array.from(new Set(all.map((t) => t.source_plan_id).filter(Boolean))) as string[];
  const planMap = new Map<string, PlanInfo>();
  if (planIds.length > 0) {
    const { data: plans } = await supabase
      .from('business_plans')
      .select('id, title, plan_type')
      .in('id', planIds);
    (plans ?? []).forEach((p: PlanInfo) => planMap.set(p.id, p));
  }

  // Group tasks by source_plan_id (null → 'none')
  type GroupKey = string; // plan_id or 'none'
  const groupOrder: GroupKey[] = [];
  const groupedTasks = new Map<GroupKey, ExecutionTask[]>();

  for (const task of all) {
    const key: GroupKey = task.source_plan_id ?? 'none';
    if (!groupedTasks.has(key)) {
      groupOrder.push(key);
      groupedTasks.set(key, []);
    }
    groupedTasks.get(key)!.push(task);
  }

  const totalDone = all.filter((t) => t.status === 'done').length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-8">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">タスク一覧</h1>
            {all.length > 0 && (
              <p className="text-sm text-gray-400 mt-0.5">{totalDone} / {all.length} 完了</p>
            )}
          </div>

          {all.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-2">
              <p className="text-gray-400 text-sm">タスクがありません</p>
              <p className="text-gray-300 text-xs">事業計画サイトの詳細画面から「実行タスクを生成」してください</p>
            </div>
          ) : (
            <div className="space-y-10">
              {groupOrder.map((planId) => {
                const planTasks = groupedTasks.get(planId)!;
                const plan = planId !== 'none' ? planMap.get(planId) : null;
                const isMvp = plan?.plan_type === 'mvp';
                const doneCnt = planTasks.filter((t) => t.status === 'done').length;

                return (
                  <section key={planId}>
                    {/* Group header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 min-w-0">
                        {isMvp && (
                          <span className="badge bg-brand-100 text-brand-700 flex-shrink-0">MVP</span>
                        )}
                        {plan ? (
                          <h2 className="text-base font-semibold text-gray-800 truncate">{plan.title}</h2>
                        ) : (
                          <h2 className="text-base font-semibold text-gray-400">未分類</h2>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{doneCnt}/{planTasks.length} 完了</span>
                    </div>

                    {/* Tasks grouped by time_slot within this plan */}
                    <div className="space-y-5">
                      {TIME_SLOTS.map((slot) => {
                        const slotTasks = planTasks.filter((t) => t.time_slot === slot);
                        if (slotTasks.length === 0) return null;
                        return (
                          <div key={slot}>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">{slot}</p>
                            <div className="space-y-2">
                              {slotTasks.map((task) => (
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
                                    <div className="flex items-center gap-1.5">
                                      <p className={`text-sm font-medium truncate ${
                                        task.status === 'done'
                                          ? 'line-through text-gray-400'
                                          : 'text-gray-900 group-hover:text-brand-700'
                                      }`}>
                                        {task.title}
                                      </p>
                                      <MentalWeightBadge weight={task.mental_weight} />
                                    </div>
                                    {task.description && (
                                      <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs text-gray-300">{formatDate(task.created_at)}</span>
                                    <ChevronRight size={15} className="text-gray-300 group-hover:text-brand-400 transition-colors" />
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
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
