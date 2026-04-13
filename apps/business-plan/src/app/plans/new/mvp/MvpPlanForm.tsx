'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Save, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';
import type { MvpGenerateResult } from '@/types';

type Fields = {
  title:            string;
  mvp_pain_point:   string;
  mvp_core_feature: string;
  mvp_acquisition:  string;
  mvp_monetization: string;
};

const FIELD_META: { key: keyof Fields; label: string; placeholder: string; rows: number }[] = [
  { key: 'title',            label: 'タイトル',           placeholder: 'MVP版のタイトル',         rows: 1 },
  { key: 'mvp_pain_point',   label: '誰のどんな不満か',    placeholder: 'ターゲットと具体的な課題', rows: 3 },
  { key: 'mvp_core_feature', label: 'MVPの1コア機能',      placeholder: '最小限で最大価値の機能',   rows: 3 },
  { key: 'mvp_acquisition',  label: '初回の集客導線',      placeholder: '具体的なチャネルと方法',   rows: 3 },
  { key: 'mvp_monetization', label: '最初の収益化方法',    placeholder: '価格・モデル・タイミング', rows: 3 },
];

export default function MvpPlanForm({ sourceIdeaId }: { sourceIdeaId: string | null }) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [genError,   setGenError]   = useState('');
  const [saveError,  setSaveError]  = useState('');
  const [snapshot,   setSnapshot]   = useState<MvpGenerateResult['idea_snapshot'] | null>(null);

  const [fields, setFields] = useState<Fields>({
    title:            '',
    mvp_pain_point:   '',
    mvp_core_feature: '',
    mvp_acquisition:  '',
    mvp_monetization: '',
  });

  useEffect(() => {
    if (!sourceIdeaId) return;
    setGenerating(true);
    setGenError('');

    fetch('/api/plans/generate-mvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_idea_id: sourceIdeaId }),
    })
      .then((r) => r.json())
      .then((data: MvpGenerateResult & { error?: string }) => {
        if (data.error) { setGenError(data.error); return; }
        setFields({
          title:            data.title,
          mvp_pain_point:   data.mvp_pain_point,
          mvp_core_feature: data.mvp_core_feature,
          mvp_acquisition:  data.mvp_acquisition,
          mvp_monetization: data.mvp_monetization,
        });
        setSnapshot(data.idea_snapshot);
      })
      .catch((e) => setGenError(e.message ?? '生成に失敗しました'))
      .finally(() => setGenerating(false));
  }, [sourceIdeaId]);

  const handleChange = (key: keyof Fields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setSaveError('');
  };

  const handleSave = async () => {
    if (!fields.title.trim()) { setSaveError('タイトルは必須です'); return; }
    setSaving(true);
    setSaveError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaveError('認証エラー'); setSaving(false); return; }

    const { data, error } = await supabase
      .from('business_plans')
      .insert({
        user_id:          user.id,
        source_idea_id:   sourceIdeaId,
        plan_type:        'mvp',
        title:            fields.title,
        mvp_pain_point:   fields.mvp_pain_point,
        mvp_core_feature: fields.mvp_core_feature,
        mvp_acquisition:  fields.mvp_acquisition,
        mvp_monetization: fields.mvp_monetization,
        idea_snapshot:    snapshot ?? {},
        status:           'draft',
        // Full fields (empty for now)
        target_customer:     '',
        value_proposition:   '',
        revenue_model:       '',
        competitor_analysis: '',
        expansion_strategy:  '',
        roadmap:             [],
      })
      .select('id')
      .single();

    if (error || !data) {
      setSaveError(error?.message ?? '保存に失敗しました');
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

          <div>
            <h1 className="text-2xl font-bold text-gray-900">MVP事業計画を作成</h1>
            <p className="text-sm text-gray-500 mt-1">最速で市場検証できる最小構成の事業計画</p>
          </div>

          {/* Generating state */}
          {generating && (
            <div className="bg-white rounded-2xl border border-brand-200 p-8 flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin text-brand-500" />
              <p className="text-sm text-gray-500">ClaudeがMVP計画を生成中...</p>
            </div>
          )}

          {genError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600">
              {genError}
            </div>
          )}

          {/* Fields */}
          {!generating && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
              {sourceIdeaId && !genError && (
                <div className="flex items-center gap-2 text-brand-600 text-xs font-semibold pb-2 border-b border-gray-100">
                  <Sparkles size={13} />
                  Claude が自動生成しました。各項目を必要に応じて修正してください。
                </div>
              )}

              {FIELD_META.map(({ key, label, placeholder, rows }) => (
                <div key={key}>
                  <label className="form-label">{label}</label>
                  {rows === 1 ? (
                    <input
                      value={fields[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="form-input"
                      placeholder={placeholder}
                    />
                  ) : (
                    <textarea
                      value={fields[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      rows={rows}
                      className="form-textarea"
                      placeholder={placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{saveError}</p>
          )}

          {!generating && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full text-base py-4"
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" />保存中...</>
              ) : (
                <><Save size={16} />MVP事業計画を作成</>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
