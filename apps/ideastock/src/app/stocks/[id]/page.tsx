import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Link2, GitMerge, Briefcase } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import StockMeta from './StockMeta';
import RefinePanel from './RefinePanel';
import SimilarPanel from './SimilarPanel';
import type { IdeaStock, OperationType } from '@/types';
import { recommendBadgeStyle, formatDate, rankFromScore, rankBadgeStyle } from '@/lib/utils';

function operationTypeStyle(v: OperationType) {
  if (v === '放置型')    return 'bg-emerald-100 text-emerald-700';
  if (v === '営業型')    return 'bg-orange-100 text-orange-700';
  if (v === 'ハイブリッド') return 'bg-sky-100 text-sky-700';
  return 'bg-gray-100 text-gray-600';
}

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
            return (
              <a
                href={`${bp}/plans/new/mvp?source_idea_id=${stock.id}`}
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
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <span className={`inline-flex items-center justify-center min-w-[3rem] text-lg font-black px-3 py-1 rounded-lg ${rankBadgeStyle(rankFromScore(stock.recommend_score))}`}>
                      {rankFromScore(stock.recommend_score)}
                    </span>
                    <span
                      className={`inline-flex items-center justify-center min-w-[5rem] tabular-nums text-3xl font-bold px-5 py-2 rounded-xl ${recommendBadgeStyle(stock.recommend_score)}`}
                    >
                      {stock.recommend_score}点
                    </span>
                  </div>
                  {stock.recommend_reason && (
                    <p className="text-sm text-gray-600 leading-relaxed pt-2">{stock.recommend_reason}</p>
                  )}
                </div>
              </section>
            )}

            {/* Hiroki priority scores */}
            {(stock.placement_score != null || stock.mental_score != null || stock.revenue_score != null) && (
              <section className="border-t border-gray-100 pt-6 space-y-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ひろき版優先順位スコア</h2>
                <div className="grid grid-cols-1 gap-3.5">
                  {stock.placement_score != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 w-28">放置度</span>
                      <ScoreDots score={stock.placement_score} />
                    </div>
                  )}
                  {stock.mental_score != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 w-28">心理的な軽さ</span>
                      <ScoreDots score={stock.mental_score} />
                    </div>
                  )}
                  {stock.revenue_score != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 w-28">収益ポテンシャル</span>
                      <ScoreDots score={stock.revenue_score} />
                    </div>
                  )}
                </div>
                {stock.placement_score != null && stock.mental_score != null && stock.revenue_score != null && (
                  <div className="flex items-center gap-3 pt-1">
                    <span className="inline-flex items-center justify-center min-w-[5rem] tabular-nums text-3xl font-bold px-5 py-2 rounded-xl bg-indigo-50 text-indigo-700 flex-shrink-0">
                      {((stock.placement_score * stock.mental_score * stock.revenue_score) / (stock.cost_score ?? 2)).toFixed(1)}
                    </span>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      放置度×心理的軽さ×収益ポテ ÷ 実装コスト
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Operation type */}
            {stock.operation_type && (
              <section className="border-t border-gray-100 pt-5">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">運用タイプ</h2>
                <span className={`badge text-sm px-3 py-1 ${operationTypeStyle(stock.operation_type)}`}>
                  {stock.operation_type}
                </span>
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
