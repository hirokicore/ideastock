'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Save, RotateCcw, Sparkles, Tag } from 'lucide-react';
import Header from '@/components/layout/Header';
import type { PlanFormData } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { recommendBadgeStyle } from '@/lib/utils';

type IdeaContext = {
  source_idea_id: string;
  title: string;
  summary: string;
  tags: string[];
  idea_list: string[];
  recommend_score: number | null;
};

export default function NewPlanForm({ ideaContext }: { ideaContext: IdeaContext | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<PlanFormData>({
    source_idea_id: ideaContext?.source_idea_id ?? '',
    title: ideaContext?.title ?? '',
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
        <div className="max-w-2xl mx-auto space-y-6">

          {/* IdeaStock context panel */}
          {ideaContext && (
            <div className="bg-white rounded-2xl border border-brand-200 p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-brand-700 font-semibold text-sm">
                  <Sparkles size={15} />
                  IdeaStock から引き継ぎ
                </div>
                {ideaContext.recommend_score != null && (
                  <span className={`inline-flex items-center justify-center min-w-[3rem] tabular-nums text-xs font-bold px-2.5 py-1 rounded-full ${recommendBadgeStyle(ideaContext.recommend_score)}`}>
                    {ideaContext.recommend_score}点
                  </span>
                )}
              </div>

              {ideaContext.summary && (
                <p className="text-sm text-gray-600 leading-relaxed">{ideaContext.summary}</p>
              )}

              {ideaContext.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {ideaContext.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">
                      <Tag size={10} />{tag}
                    </span>
                  ))}
                </div>
              )}

              {ideaContext.idea_list.length > 0 && (
                <ul className="space-y-1">
                  {ideaContext.idea_list.map((idea, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                      <span className="text-brand-400 font-bold mt-0.5 flex-shrink-0">·</span>
                      {idea}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Form */}
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

              {!ideaContext && (
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
              )}

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
