import { Layers } from 'lucide-react';
import StackDiagram from '@/components/StackDiagram';
import WorkflowCards from '@/components/WorkflowCards';
import Changelog from '@/components/Changelog';
import SummarySidebar from '@/components/SummarySidebar';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-xl">
            <Layers size={20} className="text-orange-600" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">AI Stack</h1>
            <p className="text-xs text-gray-400">ひろきのAI配線図・ワークフロー管理</p>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Content */}
          <main className="flex-1 min-w-0 space-y-10">
            <StackDiagram />
            <WorkflowCards />
            <Changelog />
          </main>

          {/* Sidebar (PC only) */}
          <div className="w-64 flex-shrink-0">
            <SummarySidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
