import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Target, DollarSign, BarChart2, TrendingUp, Map, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import StatusSelect from '../StatusSelect';
import GenerateTasksButton from '../GenerateTasksButton';
import FullPlanForm from './FullPlanForm';
import type { BusinessPlan } from '@/types';
import { recommendBadgeStyle } from '@/lib/utils';

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function FullPlanPage({
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

  // If plan_type is 'mvp', show the full plan creation form
  if (plan.plan_type === 'mvp') {
    return <FullPlanForm plan={plan} />;
  }

  // plan_type === 'full': show full detail view
  const snap = plan.idea_snapshot;
  const executionUrl = process.env.NEXT_PUBLIC_EXECUTION_URL ?? 'http://localhost:3002';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-6">

          <Link href={`/plans/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={15} />MVP版に戻る
          </Link>

          {/* Header card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <span className="badge bg-purple-100 text-purple-700 mb-1">フル版</span>
                <h1 className="text-xl font-bold text-gray-900">{plan.title}</h1>
                <p className="text-xs text-gray-400">{formatDate(plan.created_at)}</p>
              </div>
              <StatusSelect planId={plan.id} initialStatus={plan.status} />
            </div>
            {plan.source_idea_id && (
              <a
                href={`https://ideastock.vercel.app/stocks/${plan.source_idea_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 transition-colors"
              >
                <ExternalLink size={12} />元のアイデアを見る
              </a>
            )}
          </div>

          {/* Full plan fields */}
          <Section icon={<Users size={15} className="text-blue-500" />} label="ターゲット顧客">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{plan.target_customer || '—'}</p>
          </Section>

          <Section icon={<Target size={15} className="text-green-500" />} label="提供価値">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{plan.value_proposition || '—'}</p>
          </Section>

          <Section icon={<DollarSign size={15} className="text-yellow-500" />} label="収益モデル">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{plan.revenue_model || '—'}</p>
          </Section>

          <Section icon={<BarChart2 size={15} className="text-red-500" />} label="競合分析">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{plan.competitor_analysis || '—'}</p>
          </Section>

          <Section icon={<TrendingUp size={15} className="text-purple-500" />} label="拡張戦略">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{plan.expansion_strategy || '—'}</p>
          </Section>

          {/* Roadmap */}
          {plan.roadmap && plan.roadmap.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <Map size={15} className="text-orange-500" />フェーズ別ロードマップ
              </div>
              <div className="space-y-3">
                {plan.roadmap.map((phase, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">{phase.phase}</span>
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{phase.duration}</span>
                    </div>
                    <ul className="space-y-1">
                      {phase.tasks.map((task, j) => (
                        <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-brand-400 mt-0.5">·</span>{task}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Idea snapshot */}
          {snap && snap.title && (
            <div className="bg-white rounded-2xl border border-brand-100 p-5 space-y-3">
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">元のアイデア</p>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-gray-800">{snap.title}</p>
                {snap.recommend_score != null && (
                  <span className={`badge flex-shrink-0 ${recommendBadgeStyle(snap.recommend_score)}`}>
                    {snap.recommend_score}点
                  </span>
                )}
              </div>
              {snap.summary && (
                <p className="text-xs text-gray-500 leading-relaxed">{snap.summary}</p>
              )}
              {snap.tags && snap.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {snap.tags.map((t) => (
                    <span key={t} className="badge bg-gray-100 text-gray-600">{t}</span>
                  ))}
                </div>
              )}
              {plan.source_idea_id && (
                <a
                  href={`https://ideastock.vercel.app/stocks/${plan.source_idea_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 transition-colors"
                >
                  <ExternalLink size={12} />IdeaStockで見る
                </a>
              )}
            </div>
          )}

          {/* Generate tasks */}
          <GenerateTasksButton planId={plan.id} executionUrl={executionUrl} />

        </div>
      </main>
    </div>
  );
}
