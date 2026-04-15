import stackData from '@/data/stack.json';
import { Terminal, Calendar, DollarSign, Layers, Sparkles } from 'lucide-react';

type Tool = typeof stackData[number];

const NEXT_REVIEW = '2026-05-01';
const MONTHLY_COST_USD = '$42';

const COST_DOT: Record<Tool['cost_level'], string> = {
  low:  'bg-emerald-400',
  mid:  'bg-yellow-400',
  high: 'bg-red-400',
};

const PRIORITY_ORDER: Tool['priority'][] = ['first', 'normal', 'last_resort'];

export default function SummarySidebar() {
  const activeTools = stackData.filter((t) => t.status === 'active');
  const commander = stackData.find((t) => t.priority === 'first' && t.category === 'code');

  const sorted = [...activeTools].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
  );

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-6 space-y-4">
        {/* Commander */}
        {commander && (
          <div
            className="rounded-2xl p-5 text-white"
            style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Terminal size={14} />
              <span className="text-xs font-bold uppercase tracking-wider text-orange-100">司令塔</span>
            </div>
            <p className="font-bold text-base leading-tight">{commander.name}</p>
            <p className="text-xs text-orange-200 mt-1 leading-relaxed">{commander.notes}</p>
          </div>
        )}

        {/* Stats */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-brand-50 p-2 rounded-lg">
              <Layers size={16} className="text-brand-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">アクティブツール</p>
              <p className="text-xl font-bold text-gray-900">
                {activeTools.length}
                <span className="text-sm font-normal text-gray-400 ml-1">ツール</span>
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 flex items-center gap-3">
            <div className="bg-purple-50 p-2 rounded-lg">
              <Sparkles size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">候補（未導入）</p>
              <p className="text-xl font-bold text-gray-900">
                {stackData.filter((t) => t.status === 'candidate').length}
                <span className="text-sm font-normal text-gray-400 ml-1">ツール</span>
              </p>
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
                {new Date(NEXT_REVIEW).toLocaleDateString('ja-JP', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Tool list by priority */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">優先度順</p>
          <div className="space-y-2">
            {sorted.map((tool) => (
              <div key={tool.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${COST_DOT[tool.cost_level]}`} />
                  <span className="text-xs text-gray-700 truncate">{tool.name}</span>
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0">{tool.role}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-300 mt-3">● コスト: 緑=低 黄=中 赤=高</p>
        </div>
      </div>
    </aside>
  );
}
