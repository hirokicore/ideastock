import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Link2, GitMerge, Briefcase } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import StockMeta from './StockMeta';
import RefinePanel from './RefinePanel';
import SimilarPanel from './SimilarPanel';
import type { IdeaStock } from '@/types';
import { recommendBadgeStyle, formatDate } from '@/lib/utils';

function ScoreDots({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full ${i < score ? 'bg-brand-500' : 'bg-gray-200'}`}
        />
      ))}
      <span className="ml-1 text-sm text-gray-500">{score} / {max}</span>
    </div>
  );
}

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('idea_stocks')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) notFound();

  const stock = data as IdeaStock;

  // Fetch related stocks if any
  let relatedStocks: { id: string; title: string; summary: string | null; recommend_score: number | null }[] = [];
  if (stock.related_ids && stock.related_ids.length > 0) {
    const { data: related } = await supabase
      .from('idea_stocks')
      .select('id, title, summary, recommend_score')
      .in('id', stock.related_ids);
    relatedStocks = related ?? [];
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Back */}
          <Link
            href="/stocks"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={15} />
            ストック一覧に戻る
          </Link>

          {/* Header card */}
          <StockMeta
            stockId={stock.id}
            initialIntent={stock.intent}
            initialRelatedProject={stock.related_project}
            initialPriorityCategory={stock.priority_category}
            initialTimeSlot={stock.time_slot}
            sourcePlatform={stock.source_platform}
            title={stock.title}
            humanNote={stock.human_note}
            createdAt={formatDate(stock.created_at)}
          />

          {/* Send to business-plan */}
          {(() => {
            const bp = process.env.NEXT_PUBLIC_BUSINESS_PLAN_URL ?? 'http://localhost:3001';
            const qs = new URLSearchParams({
              source_idea_id: stock.id,
              title: stock.title,
              summary: stock.summary ?? '',
              tags: JSON.stringify(stock.tags ?? []),
              idea_list: JSON.stringify(stock.idea_list ?? []),
              recommend_score: String(stock.recommend_score ?? ''),
            });
            return (
              <a
                href={`${bp}/new?${qs.toString()}`}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl border border-brand-300 text-brand-600 font-semibold text-sm hover:bg-brand-50 transition-colors"
              >
                <Briefcase size={16} />
                事業計画に送る
              </a>
            );
          })()}

          {/* AI Analysis */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-7">
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest">AI 分析結果</p>

            {/* Summary */}
            {stock.summary && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">要約</h2>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{stock.summary}</p>
              </section>
            )}

            {/* Tags */}
            {stock.tags?.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">タグ</h2>
                <div className="flex flex-wrap gap-1.5">
                  {stock.tags.map((tag) => (
                    <span key={tag} className="badge bg-gray-100 text-gray-700">{tag}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Ideas */}
            {stock.idea_list?.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">抽出アイデア</h2>
                <ul className="space-y-2">
                  {stock.idea_list.map((idea, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-brand-400 font-bold mt-0.5 flex-shrink-0">·</span>
                      {idea}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Product formats */}
            {stock.product_formats?.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">商品化の形</h2>
                <div className="flex flex-wrap gap-1.5">
                  {stock.product_formats.map((fmt) => (
                    <span key={fmt} className="badge bg-indigo-50 text-indigo-700 border border-indigo-100">{fmt}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Scores */}
            {stock.recommend_score != null && (
              <section className="border-t border-gray-100 pt-6 space-y-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">スコア（5段階）</h2>

                <div className="grid grid-cols-1 gap-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 w-28">インパクト</span>
                    <ScoreDots score={stock.impact_score ?? 0} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 w-28">実現難易度</span>
                    <ScoreDots score={stock.difficulty_score ?? 0} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 w-28">継続性</span>
                    <ScoreDots score={stock.continuity_score ?? 0} />
                  </div>
                </div>

                {(stock.spread_score != null || stock.cost_score != null) && (
                  <div className="grid grid-cols-1 gap-3.5 pt-3 border-t border-gray-100">
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">スコア（3段階）</h2>
                    {stock.spread_score != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 w-28">拡散性</span>
                        <ScoreDots score={stock.spread_score} max={3} />
                      </div>
                    )}
                    {stock.cost_score != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 w-28">実装コスト</span>
                        <ScoreDots score={stock.cost_score} max={3} />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-start gap-4 pt-2">
                  <span
                    className={`inline-flex items-center justify-center min-w-[5rem] tabular-nums text-3xl font-bold px-5 py-2 rounded-xl flex-shrink-0 ${recommendBadgeStyle(stock.recommend_score)}`}
                  >
                    {stock.recommend_score}点
                  </span>
                  {stock.recommend_reason && (
                    <p className="text-sm text-gray-600 leading-relaxed pt-2">{stock.recommend_reason}</p>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Refine */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <RefinePanel
              stockId={stock.id}
              stockTitle={stock.title}
              sourcePlatform={stock.source_platform}
              rawText={stock.raw_text}
              currentScores={{
                impact: stock.impact_score,
                difficulty: stock.difficulty_score,
                continuity: stock.continuity_score,
                recommend: stock.recommend_score,
              }}
            />
          </div>

          {/* Variations */}
          {stock.variations && stock.variations.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-brand-600 font-semibold text-sm">
                <GitMerge size={15} />
                バリエーション
                <span className="text-xs font-normal text-gray-400">（統合済みのサブ案）</span>
              </div>
              <ul className="space-y-3">
                {stock.variations.map((v, i) => (
                  <li key={i} className="rounded-xl border border-gray-100 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800">{v.title}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(v.merged_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      <span className="font-medium text-gray-600">共通: </span>{v.shared_core}
                    </p>
                    {v.diff_points.length > 0 && (
                      <ul className="space-y-1">
                        {v.diff_points.map((pt, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs text-gray-500">
                            <span className="text-brand-400 font-bold mt-0.5 flex-shrink-0">·</span>
                            {pt}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Similar search */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <SimilarPanel
              stockId={stock.id}
              title={stock.title}
              summary={stock.summary ?? null}
              tags={stock.tags ?? []}
              alreadyLinkedIds={stock.related_ids ?? []}
            />
          </div>

          {/* Related ideas */}
          {relatedStocks.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-brand-600 font-semibold text-sm">
                <Link2 size={15} />
                関連アイデア
              </div>
              <ul className="space-y-2">
                {relatedStocks.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/stocks/${r.id}`}
                      className="flex items-start justify-between gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-brand-600 truncate">{r.title}</p>
                        {r.summary && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{r.summary}</p>
                        )}
                      </div>
                      {r.recommend_score != null && (
                        <span className={`inline-flex items-center justify-center flex-shrink-0 min-w-[3rem] tabular-nums text-xs font-bold px-2.5 py-1 rounded-full ${recommendBadgeStyle(r.recommend_score)}`}>
                          {r.recommend_score}点
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw text (collapsible) */}
          <details className="bg-white border border-gray-200 rounded-2xl overflow-hidden group">
            <summary className="px-6 py-4 text-sm font-medium text-gray-500 cursor-pointer select-none hover:bg-gray-50 transition-colors list-none flex items-center justify-between">
              元テキスト
              <span className="text-xs text-gray-400 group-open:hidden">展開</span>
              <span className="text-xs text-gray-400 hidden group-open:inline">閉じる</span>
            </summary>
            <div className="px-6 pb-6">
              <pre className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap break-words font-sans">
                {stock.raw_text}
              </pre>
            </div>
          </details>

        </div>
      </main>
    </div>
  );
}
