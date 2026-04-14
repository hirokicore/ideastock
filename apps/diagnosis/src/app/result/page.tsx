import { redirect } from 'next/navigation';
import Link from 'next/link';
import { diagnose, TYPE_GRADIENTS, TYPE_ACCENTS } from '@/lib/diagnosis';
import { CopyButton, XShareButton } from './ActionButtons';

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; birthday?: string }>;
}) {
  const { name, birthday } = await searchParams;

  if (!name || !birthday) redirect('/');

  const type = diagnose(birthday);
  const gradient = TYPE_GRADIENTS[type.id];
  const accent   = TYPE_ACCENTS[type.id];

  const shareText = `【生きづらさ診断】\n${name}さんは「${type.name}」タイプ\n${type.catchphrase}\n\n${type.shareable_text}`;

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-lg mx-auto space-y-5">

        {/* 結果ヘッダーカード */}
        <div className={`bg-gradient-to-br ${gradient} rounded-3xl p-8 text-white shadow-xl space-y-4`}>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{type.emoji}</span>
            <div>
              <p className="text-sm font-semibold opacity-80 uppercase tracking-wider">あなたのタイプ</p>
              <h1 className="text-2xl font-black leading-tight">{type.name}</h1>
            </div>
          </div>
          <p className="text-base font-semibold leading-snug opacity-95 border-t border-white/20 pt-4">
            {type.catchphrase}
          </p>
          <div className="bg-white/15 rounded-2xl px-4 py-2 inline-block">
            <span className="text-sm font-bold">{name} さん</span>
          </div>
        </div>

        {/* タイプ説明 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 p-6 shadow-sm space-y-2">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">タイプ解説</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{type.description}</p>
        </div>

        {/* セルフケアTips */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">セルフケア Tips</h2>
          <ul className="space-y-3">
            {type.selfcare_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 border ${accent}`}>
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* 周囲への説明文 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">周囲への説明文</h2>
            <p className="text-xs text-gray-400">信頼できる人に渡せる文章です</p>
          </div>
          <div className={`rounded-2xl p-4 border text-sm text-gray-700 leading-relaxed ${accent}`}>
            {type.shareable_text}
          </div>
          <CopyButton text={type.shareable_text} accent={accent} />
        </div>

        {/* シェア */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 p-6 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">シェアする</h2>
          <XShareButton text={shareText} />
        </div>

        {/* もう一度 */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← もう一度診断する
        </Link>

      </div>
    </main>
  );
}
