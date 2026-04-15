'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import workflowsData from '@/data/workflows.json';

type Workflow = typeof workflowsData[number];

function WorkflowCard({ workflow }: { workflow: Workflow }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{workflow.emoji}</span>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{workflow.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{workflow.description}</p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100">
          <div className="pt-4 space-y-3">
            {workflow.steps.map((step) => (
              <div key={step.order} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center mt-0.5">
                  {step.order}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                      {step.tool}
                    </span>
                    <p className="text-sm text-gray-700">{step.action}</p>
                  </div>
                  {step.note && (
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{step.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowCards() {
  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
        Workflows
      </h2>
      <div className="space-y-3">
        {workflowsData.map((wf) => (
          <WorkflowCard key={wf.id} workflow={wf} />
        ))}
      </div>
    </section>
  );
}
