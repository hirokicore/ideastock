import typesData from '@/data/types.json';

export default function TypesPage() {
  return (
    <main className="max-w-3xl mx-auto py-12 px-4 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">タイプ一覧（管理確認用）</h1>
        <p className="text-sm text-gray-500 mt-1">types.json の全データ確認ページ</p>
      </div>

      {typesData.map((type) => (
        <div key={type.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* ヘッダー */}
          <div className="bg-gray-900 text-white px-6 py-4 flex items-center gap-3">
            <span className="text-3xl">{type.emoji}</span>
            <div>
              <p className="text-xs text-gray-400">Type {type.id}</p>
              <p className="text-lg font-bold">{type.name}</p>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* キャッチコピー */}
            <section>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">キャッチコピー</p>
              <p className="text-sm font-semibold text-gray-800">{type.catchphrase}</p>
            </section>

            {/* 解説 */}
            <section>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">タイプ解説</p>
              <p className="text-sm text-gray-700 leading-relaxed">{type.description}</p>
            </section>

            {/* セルフケアTips */}
            <section>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">セルフケアTips</p>
              <ol className="space-y-1.5 list-decimal list-inside">
                {type.selfcare_tips.map((tip, i) => (
                  <li key={i} className="text-sm text-gray-700 leading-relaxed">{tip}</li>
                ))}
              </ol>
            </section>

            {/* 周囲への説明文 */}
            <section>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">周囲への説明文</p>
              <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 leading-relaxed">
                {type.shareable_text}
              </p>
              <p className="text-xs text-gray-400 mt-1">{type.shareable_text.length}字</p>
            </section>
          </div>
        </div>
      ))}
    </main>
  );
}
