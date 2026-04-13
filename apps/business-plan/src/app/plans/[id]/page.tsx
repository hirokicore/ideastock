import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Zap, Megaphone, DollarSign, ExternalLink, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import StatusSelect from './StatusSelect';
import GenerateTasksButton from './GenerateTasksButton';
import type { BusinessPlan } from '@/types';
import { recommendBadgeStyle } from '@/lib/utils';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
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

  // If this plan is full type, show full detail redirect
  if (plan.plan_type === 'full') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-10 px-4">
          <div className="max-w-2xl mx-auto space-y-4">
            <Link href="/plans" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
              <ArrowLeft size={15} />事業計画一覧に戻る
            </Link>
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-3">
              <p className="text-gray-600 text-sm">この計画はフル版です</p>
              <Link href={`/plans/${id}/full`} className="btn-primary inline-flex">
                フル版を見る <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const snap = plan.idea_snapshot;
  const executionUrl = process.env.NEXT_PUBLIC_EXECUTION_URL ?? 'http://localhost:3002';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-6">

          <Link href="/plans" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={15} />
            事業計画一覧に戻る
          </Link>

          {/* Header card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <span className="badge bg-brand-100 text-brand-700 mb-1">MVP</span>
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

          {/* MVP 5 fields */}
          <Section icon={<Users size={15} className="text-blue-500" />} label="誰のどんな不満か">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{plan.mvp_pain_point || '—'}</p>
          </Section>

          <Section icon={<Zap size={15} className="text-yellow-500" />} label="MVPの1コア機能">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{plan.mvp_core_feature || '—'}</p>
          </Section>

          <Section icon={<Megaphone size={15} className="text-green-500" />} label="初回の集客導線">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{plan.mvp_acquisition || '—'}</p>
          </Section>

          <Section icon={<DollarSign size={15} className="text-purple-500" />} label="最初の収益化方法">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{plan.mvp_monetization || '—'}</p>
          </Section>

          {/* Idea snapshot panel */}
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
            </div>
          )}

          {/* Generate tasks */}
          <GenerateTasksButton planId={plan.id} executionUrl={executionUrl} />

          {/* CTA: Go to full plan */}
          <Link
            href={`/plans/${plan.id}/full`}
            className="flex items-center justify-center gap-2 w-full py-4 px-4 rounded-2xl bg-brand-600 text-white font-semibold text-base hover:bg-brand-700 transition-colors"
          >
            本格的な事業計画を作成
            <ChevronRight size={18} />
          </Link>

        </div>
      </main>
    </div>
  );
}
