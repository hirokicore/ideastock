'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import changelogData from '@/data/changelog.json';

const TAG_COLORS: Record<string, string> = {
  '新機能': 'bg-emerald-100 text-emerald-700',
  '改善': 'bg-blue-100 text-blue-700',
  'インフラ': 'bg-orange-100 text-orange-700',
  'ideastock': 'bg-brand-100 text-brand-700',
  'business-plan': 'bg-purple-100 text-purple-700',
  'execution': 'bg-amber-100 text-amber-700',
  'diagnosis': 'bg-pink-100 text-pink-700',
  'ai-stack': 'bg-gray-100 text-gray-600',
};

function tagStyle(tag: string) {
  return TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-500';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Changelog() {
  const [expanded, setExpanded] = useState(false);
  const INITIAL_COUNT = 3;
  const visible = expanded ? changelogData : changelogData.slice(0, INITIAL_COUNT);

  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
        Changelog
      </h2>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-100">
        {visible.map((entry, i) => (
          <div key={i} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm leading-snug">{entry.title}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{entry.description}</p>
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entry.tags.map((tag) => (
                      <span key={tag} className={`badge ${tagStyle(tag)}`}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0 pt-0.5">{formatDate(entry.date)}</span>
            </div>
          </div>
        ))}
      </div>

      {changelogData.length > INITIAL_COUNT && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors py-2"
        >
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
          {expanded ? '閉じる' : `さらに ${changelogData.length - INITIAL_COUNT} 件表示`}
        </button>
      )}
    </section>
  );
}
