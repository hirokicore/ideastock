'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, SlidersHorizontal } from 'lucide-react';
import Header from '@/components/layout/Header';
import type { IdeaStock, Intent, RelatedProject } from '@/types';
import { recommendBadgeStyle, formatDate } from '@/lib/utils';

type SortKey = 'recommend_score' | 'impact_score' | 'difficulty_score' | 'created_at';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recommend_score', label: 'おすすめ度' },
  { key: 'impact_score',    label: 'インパクト' },
  { key: 'difficulty_score', label: '実現難易度' },
  { key: 'created_at',      label: '新着順' },
];

const INTENT_OPTIONS: (Intent | 'すべて')[] = ['すべて', '商品化したい', '後で考えたい', 'ただのメモ'];
const PROJECT_OPTIONS: (RelatedProject | 'すべて')[] = ['すべて', 'TrainerDocs', 'IdeaStock', 'その他'];

function ScorePips({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`w-2 h-2 rounded-full ${i <= score ? 'bg-brand-400' : 'bg-gray-200'}`} />
      ))}
    </div>
  );
}

function intentStyle(intent: string) {
  if (intent === '商品化したい') return 'bg-green-100 text-green-700';
  if (intent === '後で考えたい')  return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-600';
}

export default function StocksClient({ initialStocks }: { initialStocks: IdeaStock[] }) {
  const [sort, setSort]          = useState<SortKey>('recommend_score');
  const [filterIntent, setFilterIntent]   = useState<Intent | 'すべて'>('すべて');
  const [filterProject, setFilterProject] = useState<RelatedProject | 'すべて'>('すべて');

  const stocks = useMemo(() => {
    let list = [...initialStocks];

    if (filterIntent !== 'すべて')  list = list.filter((s) => s.intent === filterIntent);
    if (filterProject !== 'すべて') list = list.filter((s) => s.related_project === filterProject);

    list.sort((a, b) => {
      if (sort === 'created_at') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === 'difficulty_score') return (a[sort] ?? 0) - (b[sort] ?? 0); // 低い順（やりやすい）
      return (b[sort] ?? 0) - (a[sort] ?? 0);
    });

    return list;
  }, [initialStocks, sort, filterIntent, filterProject]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">
              ストック一覧
              <span className="ml-2 text-sm font-normal text-gray-400">{stocks.length}件</span>
            </h1>
            <Link href="/new" className="btn-primary text-sm py-2 px-4">
              <Plus size={16} />
              新規登録
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center">
            <SlidersHorizontal size={16} className="text-gray-400 flex-shrink-0" />

            {/* Sort */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 font-medium">並び替え</span>
              <div className="flex gap-1 flex-wrap">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSort(opt.key)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                      sort === opt.key
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px h-5 bg-gray-200 hidden sm:block" />

            {/* Intent filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 font-medium">用途</span>
              <div className="flex gap-1 flex-wrap">
                {INTENT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFilterIntent(opt as Intent | 'すべて')}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                      filterIntent === opt
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px h-5 bg-gray-200 hidden sm:block" />

            {/* Project filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 font-medium">プロジェクト</span>
              <div className="flex gap-1 flex-wrap">
                {PROJECT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFilterProject(opt as RelatedProject | 'すべて')}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                      filterProject === opt
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Empty state */}
          {stocks.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg font-medium mb-2">ストックがありません</p>
              <p className="text-sm mb-6">まずはアイデアや会話ログを登録してみましょう。</p>
              <Link href="/new" className="btn-primary">
                <Plus size={16} />
                最初のストックを登録
              </Link>
            </div>
          )}

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stocks.map((stock) => (
              <div
                key={stock.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
              >
                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="badge bg-brand-50 text-brand-600">{stock.source_platform}</span>
                  <span className={`badge ${intentStyle(stock.intent)}`}>{stock.intent}</span>
                  <span className="badge bg-gray-100 text-gray-500">{stock.related_project}</span>
                </div>

                {/* Title */}
                <h2 className="font-semibold text-gray-900 leading-snug line-clamp-2">{stock.title}</h2>

                {/* Summary */}
                {stock.summary && (
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{stock.summary}</p>
                )}

                {/* Tags */}
                {stock.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {stock.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="badge bg-gray-50 text-gray-500 border border-gray-100 text-[11px]">
                        {tag}
                      </span>
                    ))}
                    {stock.tags.length > 4 && (
                      <span className="badge bg-gray-50 text-gray-400 border border-gray-100 text-[11px]">
                        +{stock.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Scores */}
                {stock.recommend_score != null && (
                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between gap-3">
                    <div className="flex gap-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        影響
                        <ScorePips score={stock.impact_score ?? 0} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        難度
                        <ScorePips score={stock.difficulty_score ?? 0} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        継続
                        <ScorePips score={stock.continuity_score ?? 0} />
                      </div>
                    </div>
                    <span
                      className={`badge text-sm font-bold px-3 py-1 ${recommendBadgeStyle(stock.recommend_score)}`}
                    >
                      {stock.recommend_score}点
                    </span>
                  </div>
                )}

                {/* Recommend reason + date */}
                <div className="flex items-end justify-between gap-2">
                  {stock.recommend_reason && (
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-1 flex-1">
                      {stock.recommend_reason}
                    </p>
                  )}
                  <span className="text-xs text-gray-300 flex-shrink-0">{formatDate(stock.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
