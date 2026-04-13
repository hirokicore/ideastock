import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Target, Lightbulb, DollarSign, Map } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import StatusSelect from './StatusSelect';
import type { BusinessPlan } from '@/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('business_plans')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single();

  if (error || !data) notFound();

  const plan = data as BusinessPlan;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-6">

          <Link
            href="/plans"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={15} />
            事業計画一覧に戻る
          </Link>

          {/* Header card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <h1 className="text-xl font-bold text-gray-900">{plan.title}</h1>
                <p className="text-xs text-gray-400">{formatDate(plan.created_at)}</p>
              </div>
              <StatusSelect planId={plan.id} initialStatus={plan.status} />
            </div>

            {plan.source_idea_id && (
              <p className="text-xs text-gray-400">
                元アイデアID: <span className="font-mono">{plan.source_idea_id}</span>
              </p>
            )}
          </div>

          {/* Business model cards */}
          <div className="grid grid-cols-1 gap-4">
            <Section icon={<Target size={16} className="text-blue-500" />} label="ターゲット顧客">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{plan.target_customer}</p>
            </Section>

            <Section icon={<Lightbulb size={16} className="text-yellow-500" />} label="提供価値">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{plan.value_proposition}</p>
            </Section>

            <Section icon={<DollarSign size={16} className="text-green-500" />} label="収益モデル">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{plan.revenue_model}</p>
            </Section>
          </div>

          {/* Roadmap */}
          {plan.roadmap && plan.roadmap.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Map size={16} className="text-brand-500" />
                ロードマップ
              </div>
              <div className="space-y-4">
                {plan.roadmap.map((phase, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      {i < plan.roadmap.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-baseline gap-2 mb-1.5">
                        <p className="font-semibold text-sm text-gray-900">{phase.phase}</p>
                        <span className="text-xs text-gray-400">{phase.duration}</span>
                      </div>
                      <ul className="space-y-1">
                        {phase.tasks.map((task, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="text-brand-400 font-bold mt-0.5 flex-shrink-0">·</span>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Section({ icon, label, children }: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {icon}{label}
      </div>
      {children}
    </div>
  );
}
