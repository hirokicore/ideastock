import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import type { IdeaStock } from '@/types';
import { recommendBadgeStyle, formatDate } from '@/lib/utils';

function ScoreDots({ score }: { score: number }) {
  return (
    <div className="flex gap-1.5 items-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full ${i <= score ? 'bg-brand-500' : 'bg-gray-200'}`}
        />
      ))}
      <span className="ml-1 text-sm text-gray-500">{score} / 5</span>
    </div>
  );
}

function intentStyle(intent: string) {
  if (intent === '商品化したい') return 'bg-green-100 text-green-700';
  if (intent === '後で考えたい')  return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-600';
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
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="badge bg-brand-50 text-brand-600">{stock.source_platform}</span>
              <span className={`badge ${intentStyle(stock.intent)}`}>{stock.intent}</span>
              <span className="badge bg-gray-100 text-gray-500">{stock.related_project}</span>
              <span className="ml-auto text-xs text-gray-400">{formatDate(stock.created_at)}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{stock.title}</h1>
            {stock.human_note && (
              <p className="text-sm text-gray-500 italic border-l-2 border-brand-200 pl-3">
                {stock.human_note}
              </p>
            )}
          </div>

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
              <section className="border-t border-gray-100 pt-6 space-y-5">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">スコア</h2>

                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 w-24">インパクト</span>
                    <ScoreDots score={stock.impact_score ?? 0} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 w-24">実現難易度</span>
                    <ScoreDots score={stock.difficulty_score ?? 0} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 w-24">継続性</span>
                    <ScoreDots score={stock.continuity_score ?? 0} />
                  </div>
                </div>

                <div className="flex items-start gap-4 pt-1">
                  <span
                    className={`text-3xl font-bold px-5 py-2 rounded-xl flex-shrink-0 ${recommendBadgeStyle(stock.recommend_score)}`}
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
