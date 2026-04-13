'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Save, RotateCcw } from 'lucide-react';
import Header from '@/components/layout/Header';
import type { PlanFormData } from '@/types';
import { createClient } from '@/lib/supabase/client';

export default function NewPlanPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<PlanFormData>({
    source_idea_id: '',
    title: '',
    target_customer: '',
    value_proposition: '',
    revenue_model: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('認証エラー'); setSaving(false); return; }

    const { data, error: insertError } = await supabase
      .from('business_plans')
      .insert({
        user_id: user.id,
        source_idea_id: form.source_idea_id || null,
        title: form.title,
        target_customer: form.target_customer,
        value_proposition: form.value_proposition,
        revenue_model: form.revenue_model,
        roadmap: [],
        status: 'draft',
      })
      .select('id')
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? '保存に失敗しました');
      setSaving(false);
      return;
    }

    router.push(`/plans/${data.id}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
              <h1 className="text-xl font-bold text-gray-900">新規事業計画</h1>

              <div>
                <label className="form-label">タイトル <span className="text-red-500">*</span></label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="例：パーソナルトレーナー向け書類自動生成SaaS"
                />
              </div>

              <div>
                <label className="form-label">元アイデアID（任意）</label>
                <input
                  name="source_idea_id"
                  value={form.source_idea_id}
                  onChange={handleChange}
                  className="form-input font-mono text-xs"
                  placeholder="IdeaStock の UUID（任意）"
                />
                <p className="mt-1 text-xs text-gray-400">IdeaStock のアイデアから起こす場合は UUID を入力してください</p>
              </div>

              <div>
                <label className="form-label">ターゲット顧客 <span className="text-red-500">*</span></label>
                <textarea
                  name="target_customer"
                  value={form.target_customer}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="form-textarea"
                  placeholder="例：フリーランスのパーソナルトレーナー（月20名以上担当）"
                />
              </div>

              <div>
                <label className="form-label">提供価値 <span className="text-red-500">*</span></label>
                <textarea
                  name="value_proposition"
                  value={form.value_proposition}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="form-textarea"
                  placeholder="例：月10時間かかる書類作業を1時間に削減し、本来の指導に集中できる"
                />
              </div>

              <div>
                <label className="form-label">収益モデル <span className="text-red-500">*</span></label>
                <textarea
                  name="revenue_model"
                  value={form.revenue_model}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="form-textarea"
                  placeholder="例：月額3,980円のサブスク（無料トライアル14日）、年払い割引あり"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary flex-1"
              >
                <RotateCcw size={16} />
                キャンセル
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />保存中...</>
                ) : (
                  <><Save size={16} />下書き保存</>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
