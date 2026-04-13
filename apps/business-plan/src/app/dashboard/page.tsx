import Link from 'next/link';
import { FileText, PlusCircle, Archive, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import type { BusinessPlan } from '@/types';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: plans } = await supabase
    .from('business_plans')
    .select('id, title, status, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  const all = (plans ?? []) as Pick<BusinessPlan, 'id' | 'title' | 'status' | 'created_at'>[];
  const counts = {
    total: all.length,
    active: all.filter((p) => p.status === 'active').length,
    draft: all.filter((p) => p.status === 'draft').length,
    archived: all.filter((p) => p.status === 'archived').length,
  };
  const recent = all.slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-8">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
            <p className="text-sm text-gray-500 mt-1">{user!.email}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: '合計',     value: counts.total,    icon: FileText, color: 'text-brand-600 bg-brand-50' },
              { label: '進行中',   value: counts.active,   icon: Zap,      color: 'text-green-600 bg-green-50' },
              { label: '下書き',   value: counts.draft,    icon: FileText, color: 'text-yellow-600 bg-yellow-50' },
              { label: 'アーカイブ', value: counts.archived, icon: Archive,  color: 'text-gray-500 bg-gray-100' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent plans */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">最近の事業計画</h2>
              <Link href="/plans" className="text-sm text-brand-600 hover:text-brand-700">すべて見る →</Link>
            </div>

            {recent.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-gray-400 text-sm">まだ事業計画がありません</p>
                <Link href="/new" className="btn-primary inline-flex">
                  <PlusCircle size={15} />
                  最初の事業計画を作成
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recent.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/plans/${p.id}`}
                      className="flex items-center justify-between py-3 group hover:text-brand-600 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-800 group-hover:text-brand-600 truncate">{p.title}</span>
                      <StatusBadge status={p.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* CTA */}
          <Link href="/new" className="btn-primary w-full text-base py-4 justify-center">
            <PlusCircle size={18} />
            新しい事業計画を作成
          </Link>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: BusinessPlan['status'] }) {
  const styles = {
    active:   'bg-green-100 text-green-700',
    draft:    'bg-yellow-100 text-yellow-700',
    archived: 'bg-gray-100 text-gray-500',
  };
  const labels = { active: '進行中', draft: '下書き', archived: 'アーカイブ' };
  return <span className={`badge flex-shrink-0 ${styles[status]}`}>{labels[status]}</span>;
}
