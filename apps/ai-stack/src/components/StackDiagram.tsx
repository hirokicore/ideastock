import stackData from '@/data/stack.json';
import { Terminal, Cpu, Zap, Brain, MessageCircle, Search, FileText, Image, Layout, Server, Database } from 'lucide-react';

type IconName = 'terminal' | 'cpu' | 'zap' | 'brain' | 'message-circle' | 'search' | 'file-text' | 'image' | 'layout' | 'server' | 'database';

function NodeIcon({ name, size = 16 }: { name: string; size?: number }) {
  const props = { size, strokeWidth: 2 };
  const icons: Record<IconName, React.ReactNode> = {
    terminal: <Terminal {...props} />,
    cpu: <Cpu {...props} />,
    zap: <Zap {...props} />,
    brain: <Brain {...props} />,
    'message-circle': <MessageCircle {...props} />,
    search: <Search {...props} />,
    'file-text': <FileText {...props} />,
    image: <Image {...props} />,
    layout: <Layout {...props} />,
    server: <Server {...props} />,
    database: <Database {...props} />,
  };
  return <>{icons[name as IconName] ?? <Cpu {...props} />}</>;
}

export default function StackDiagram() {
  const { commander, categories } = stackData;

  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
        AI Stack Diagram
      </h2>

      {/* Commander */}
      <div className="flex justify-center mb-8">
        <div
          className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl shadow-md text-white min-w-[180px]"
          style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)' }}
        >
          <div className="bg-white/20 p-2 rounded-lg">
            <NodeIcon name={commander.icon} size={22} />
          </div>
          <div className="text-center">
            <p className="font-bold text-base leading-tight">{commander.name}</p>
            <p className="text-xs text-orange-100 mt-0.5">{commander.role}</p>
          </div>
          <p className="text-xs text-orange-100 text-center leading-relaxed max-w-[200px]">
            {commander.description}
          </p>
        </div>
      </div>

      {/* Connector line */}
      <div className="flex justify-center mb-6">
        <div className="w-px h-6 bg-gray-300" />
      </div>

      {/* Category nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
          >
            <div
              className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"
              style={{ color: cat.color }}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: cat.color }}
              />
              {cat.label}
            </div>
            <div className="space-y-3">
              {cat.nodes.map((node) => (
                <div
                  key={node.name}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: `${cat.color}10` }}
                >
                  <div
                    className="p-1.5 rounded-lg flex-shrink-0 text-white"
                    style={{ background: cat.color }}
                  >
                    <NodeIcon name={node.icon} size={13} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{node.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{node.role}</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{node.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
