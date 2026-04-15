import stackData from '@/data/stack.json';
import { Terminal, Calendar, DollarSign, Layers } from 'lucide-react';

const NEXT_REVIEW = '2026-05-01';
const MONTHLY_COST_USD = '$42';

export default function SummarySidebar() {
  const totalNodes = stackData.categories.reduce((sum, cat) => sum + cat.nodes.length, 0);

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-6 space-y-4">
        {/* Commander */}
        <div
          className="rounded-2xl p-5 text-white"
          style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Terminal size={16} />
            <span className="text-xs font-bold uppercase tracking-wider text-orange-100">司令塔</span>
          </div>
          <p className="font-bold text-lg leading-tight">{stackData.commander.name}</p>
          <p className="text-xs text-orange-200 mt-1">{stackData.commander.description}</p>
        </div>

        {/* Stats */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-brand-50 p-2 rounded-lg">
              <Layers size={16} className="text-brand-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">AI ツール数</p>
              <p className="text-xl font-bold text-gray-900">{totalNodes + 1} <span className="text-sm font-normal text-gray-400">ツール</span></p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 flex items-center gap-3">
            <div className="bg-emerald-50 p-2 rounded-lg">
              <DollarSign size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">月額コスト（概算）</p>
              <p className="text-xl font-bold text-gray-900">{MONTHLY_COST_USD}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Calendar size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">次回スタック見直し</p>
              <p className="text-sm font-bold text-gray-900">
                {new Date(NEXT_REVIEW).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Category list */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">カテゴリ</p>
          <div className="space-y-2">
            {stackData.categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: cat.color }}
                  />
                  <span className="text-xs text-gray-600">{cat.label}</span>
                </div>
                <span className="text-xs text-gray-400">{cat.nodes.length} ツール</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
