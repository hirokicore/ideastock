import Link from 'next/link';
import { PlusCircle, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import type { BusinessPlan } from '@/types';

function StatusBadge({ status }: { status: BusinessPlan['status'] }) {
  const styles = {
    active:   'bg-green-100 text-green-700',
    draft:    'bg-yellow-100 text-yellow-700',
    archived: 'bg-gray-100 text-gray-500',
  };
  const labels = { active: '進行中', draft: '下書き', archived: 'アーカイブ' };
  return <span className={`badge ${styles[status]}`}>{labels[status]}</span>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default async function PlansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: plans } = await supabase
    .from('business_plans')
    .select('id, title, target_customer, status, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  const list = (plans ?? []) as Pick<BusinessPlan, 'id' | 'title' | 'target_customer' | 'status' | 'created_at'>[];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-6">

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">事業計画一覧</h1>
            <Link href="/new" className="btn-primary">
              <PlusCircle size={15} />
              新規作成
            </Link>
          </div>

          {list.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
              <p className="text-gray-400">まだ事業計画がありません</p>
              <Link href="/new" className="btn-primary inline-flex">
                <PlusCircle size={15} />
                最初の事業計画を作成
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/plans/${plan.id}`}
                  className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 hover:border-brand-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={plan.status} />
                      <span className="text-xs text-gray-400">{formatDate(plan.created_at)}</span>
                    </div>
                    <p className="font-semibold text-gray-900 group-hover:text-brand-700 truncate">{plan.title}</p>
                    {plan.target_customer && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">対象: {plan.target_customer}</p>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-gray-300 flex-shrink-0 group-hover:text-brand-400 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
