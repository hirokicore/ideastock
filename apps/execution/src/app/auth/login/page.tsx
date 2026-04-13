'use client';

import { useState, FormEvent } from 'react';
import { Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません');
    } else {
      window.location.href = '/tasks';
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 text-brand-700 font-bold text-xl mb-8 justify-center">
          <Zap size={26} />
          Execution
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="form-label">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="form-input"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="form-label">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ログイン中...
              </>
            ) : (
              'ログイン'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
