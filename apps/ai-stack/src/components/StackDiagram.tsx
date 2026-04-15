import stackData from '@/data/stack.json';

type Tool = typeof stackData[number];
type Category = Tool['category'];
type CostLevel = Tool['cost_level'];
type TokenLoad = Tool['token_load'];
type Priority = Tool['priority'];

const CATEGORY_META: Record<Category, { label: string; color: string }> = {
  code:       { label: 'コーディング', color: '#6d28d9' },
  chatbot:    { label: 'チャット・思考', color: '#0369a1' },
  search:     { label: '検索・調査', color: '#047857' },
  image:      { label: '画像生成', color: '#be185d' },
  automation: { label: '自動化', color: '#b45309' },
  other:      { label: 'その他', color: '#4b5563' },
};

const COST_LABEL: Record<CostLevel, { label: string; style: string }> = {
  low:  { label: 'Low',  style: 'bg-emerald-100 text-emerald-700' },
  mid:  { label: 'Mid',  style: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'High', style: 'bg-red-100 text-red-700' },
};

const TOKEN_LABEL: Record<TokenLoad, { label: string; style: string }> = {
  light:  { label: 'Light', style: 'bg-sky-100 text-sky-700' },
  mid:    { label: 'Mid',   style: 'bg-indigo-100 text-indigo-700' },
  heavy:  { label: 'Heavy', style: 'bg-purple-100 text-purple-700' },
};

const PRIORITY_LABEL: Record<Priority, { label: string; style: string }> = {
  first:       { label: '最優先',    style: 'bg-orange-100 text-orange-700' },
  normal:      { label: '通常',      style: 'bg-gray-100 text-gray-600' },
  last_resort: { label: '最終手段', style: 'bg-gray-50 text-gray-400' },
};

function ToolCard({ tool }: { tool: Tool }) {
  const cat = CATEGORY_META[tool.category];
  const cost = COST_LABEL[tool.cost_level];
  const token = TOKEN_LABEL[tool.token_load];
  const priority = PRIORITY_LABEL[tool.priority];
  const isCommander = tool.priority === 'first' && tool.category === 'code';

  return (
    <div
      className={`bg-white rounded-2xl p-4 shadow-sm border flex flex-col gap-3 ${
        isCommander ? 'border-orange-300 ring-1 ring-orange-200' : 'border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {isCommander && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500 text-white uppercase tracking-wider">
                司令塔
              </span>
            )}
            <p className="font-bold text-gray-900 text-sm leading-tight">{tool.name}</p>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{tool.role}</p>
        </div>
        <div
          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: `${cat.color}18`, color: cat.color }}
        >
          {cat.label}
        </div>
      </div>

      {/* Use cases */}
      <ul className="space-y-1">
        {tool.main_use_cases.map((uc) => (
          <li key={uc} className="flex items-start gap-1.5 text-xs text-gray-600">
            <span className="text-gray-300 flex-shrink-0 mt-0.5">·</span>
            {uc}
          </li>
        ))}
      </ul>

      {/* When to call */}
      <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-100 pt-2">
        <span className="font-medium text-gray-500">呼ぶとき：</span>{tool.when_to_call}
      </p>

      {/* Badges */}
      <div className="flex flex-wrap gap-1 pt-1">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cost.style}`}>
          コスト: {cost.label}
        </span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${token.style}`}>
          トークン: {token.label}
        </span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${priority.style}`}>
          {priority.label}
        </span>
      </div>

      {/* Notes */}
      {tool.notes && (
        <p className="text-[11px] text-gray-400 leading-relaxed border-t border-gray-100 pt-2">
          {tool.notes}
        </p>
      )}
    </div>
  );
}

export default function StackDiagram() {
  const activeTools = stackData.filter((t) => t.status === 'active');
  const candidateTools = stackData.filter((t) => t.status === 'candidate');

  return (
    <section className="space-y-8">
      {/* Active tools */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
          Active Stack
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>

      {/* Candidate tools */}
      {candidateTools.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
            Candidates（将来候補）
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {candidateTools.map((tool) => (
              <div
                key={tool.id}
                className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-4 flex flex-col gap-2 opacity-75"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-600 text-sm">{tool.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{tool.role}</p>
                  </div>
                  <div
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: `${CATEGORY_META[tool.category].color}12`,
                      color: CATEGORY_META[tool.category].color,
                    }}
                  >
                    {CATEGORY_META[tool.category].label}
                  </div>
                </div>
                <ul className="space-y-1">
                  {tool.main_use_cases.slice(0, 2).map((uc) => (
                    <li key={uc} className="flex items-start gap-1.5 text-xs text-gray-400">
                      <span className="text-gray-300 flex-shrink-0">·</span>
                      {uc}
                    </li>
                  ))}
                </ul>
                {tool.notes && (
                  <p className="text-[11px] text-gray-400 leading-relaxed border-t border-gray-200 pt-2">
                    {tool.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
