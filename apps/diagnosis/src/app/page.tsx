'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS   = Array.from({ length: 31 }, (_, i) => i + 1);

export default function HomePage() {
  const router = useRouter();
  const [name,    setName]    = useState('');
  const [month,   setMonth]   = useState('');
  const [day,     setDay]     = useState('');
  const [loading, setLoading] = useState(false);

  const isReady = name.trim() && month && day;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isReady) return;
    setLoading(true);
    const birthday = `${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    router.push(`/result?name=${encodeURIComponent(name.trim())}&birthday=${encodeURIComponent(birthday)}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="text-5xl mb-4">🫧</div>
          <h1 className="text-3xl font-black text-gray-900 leading-tight tracking-tight">
            生きづらさ<br />タイプ診断
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            名前と誕生日だけで、あなたの<br />
            「生きにくさのパターン」がわかります。
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8 space-y-6">

          {/* 名前 */}
          <div className="space-y-1">
            <label className="form-label" htmlFor="name">
              名前<span className="text-gray-400 font-normal">（ニックネームでOK）</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：たろう、はなこ"
              className="form-input"
              maxLength={20}
            />
          </div>

          {/* 誕生日（月・日） */}
          <div className="space-y-1">
            <p className="form-label">誕生日</p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="form-input appearance-none pr-8 cursor-pointer"
                >
                  <option value="">月</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={String(m)}>{m}月</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▼</span>
              </div>
              <div className="relative flex-1">
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="form-input appearance-none pr-8 cursor-pointer"
                >
                  <option value="">日</option>
                  {DAYS.map((d) => (
                    <option key={d} value={String(d)}>{d}日</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▼</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isReady || loading}
            className="btn-primary w-full text-white text-base"
            style={{
              background: (!isReady || loading)
                ? '#c4b5fd'
                : 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                診断中...
              </>
            ) : (
              '診断する →'
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            入力した情報はサーバーに送信されません
          </p>
        </div>

        {/* 8 types preview */}
        <div className="grid grid-cols-4 gap-2 px-2">
          {['🏔️', '🌸', '⚖️', '⚡', '🌊', '🌀', '🔭', '🫧'].map((emoji, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-3 text-center text-xl shadow-sm border border-purple-100"
            >
              {emoji}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400">8タイプのうち、あなたはどれ？</p>

      </div>
    </main>
  );
}
