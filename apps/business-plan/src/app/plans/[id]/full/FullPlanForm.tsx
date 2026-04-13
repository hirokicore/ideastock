'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Save, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';
import type { BusinessPlan, FullGenerateResult, RoadmapPhase } from '@/types';

type Fields = {
  target_customer:     string;
  value_proposition:   string;
  revenue_model:       string;
  competitor_analysis: string;
  expansion_strategy:  string;
};

const FIELD_META: { key: keyof Fields; label: string; placeholder: string }[] = [
  { key: 'target_customer',     label: 'ターゲット顧客',   placeholder: '詳細なターゲット顧客像' },
  { key: 'value_proposition',   label: '提供価値',         placeholder: 'ユーザーが得られる成果・変化' },
  { key: 'revenue_model',       label: '収益モデル',       placeholder: '価格設定・課金形態・拡大の道筋' },
  { key: 'competitor_analysis', label: '競合分析',         placeholder: '主要競合と自社の差別化ポイント' },
  { key: 'expansion_strategy',  label: '拡張戦略',         placeholder: 'MVP後の機能拡張・市場拡大' },
];

export default function FullPlanForm({ plan }: { plan: BusinessPlan }) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [genError,   setGenError]   = useState('');
  const [saveError,  setSaveError]  = useState('');
  const [roadmap,    setRoadmap]    = useState<RoadmapPhase[]>([]);

  const [fields, setFields] = useState<Fields>({
    target_customer:     '',
    value_proposition:   '',
    revenue_model:       '',
    competitor_analysis: '',
    expansion_strategy:  '',
  });

  useEffect(() => {
    setGenerating(true);
    setGenError('');

    fetch('/api/plans/generate-full', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: plan.id }),
    })
      .then((r) => r.json())
      .then((data: FullGenerateResult & { error?: string }) => {
        if (data.error) { setGenError(data.error); return; }
        setFields({
          target_customer:     data.target_customer,
          value_proposition:   data.value_proposition,
          revenue_model:       data.revenue_model,
          competitor_analysis: data.competitor_analysis,
          expansion_strategy:  data.expansion_strategy,
        });
        setRoadmap(Array.isArray(data.roadmap) ? data.roadmap : []);
      })
      .catch((e) => setGenError(e.message ?? 'フル版生成に失敗しました'))
      .finally(() => setGenerating(false));
  }, [plan.id]);

  const handleChange = (key: keyof Fields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setSaveError('');
  };

  const handleRoadmapChange = (index: number, field: keyof RoadmapPhase, value: string | string[]) => {
    setRoadmap((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
    setSaveError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');

    const supabase = createClient();
    const { error } = await supabase
      .from('business_plans')
      .update({
        plan_type:           'full',
        target_customer:     fields.target_customer,
        value_proposition:   fields.value_proposition,
        revenue_model:       fields.revenue_model,
        competitor_analysis: fields.competitor_analysis,
        expansion_strategy:  fields.expansion_strategy,
        roadmap:             roadmap,
      })
      .eq('id', plan.id);

    if (error) {
      setSaveError(error.message ?? '保存に失敗しました');
      setSaving(false);
      return;
    }

    router.push(`/plans/${plan.id}/full`);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-6">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">本格的な事業計画を作成</h1>
            <p className="text-sm text-gray-500 mt-1">{plan.title}</p>
          </div>

          {generating && (
            <div className="bg-white rounded-2xl border border-brand-200 p-8 flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin text-brand-500" />
              <p className="text-sm text-gray-500">Claudeがフルプランを生成中...</p>
            </div>
          )}

          {genError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600">
              {genError}
            </div>
          )}

          {!generating && (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
                {!genError && (
                  <div className="flex items-center gap-2 text-brand-600 text-xs font-semibold pb-2 border-b border-gray-100">
                    <Sparkles size={13} />
                    Claude が自動生成しました。各項目を必要に応じて修正してください。
                  </div>
                )}

                {FIELD_META.map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="form-label">{label}</label>
                    <textarea
                      value={fields[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      rows={4}
                      className="form-textarea"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>

              {/* Roadmap */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                <h2 className="text-sm font-semibold text-gray-700">フェーズ別ロードマップ</h2>
                {roadmap.length === 0 && (
                  <p className="text-sm text-gray-400">ロードマップが生成されていません</p>
                )}
                {roadmap.map((phase, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="form-label">フェーズ名</label>
                        <input
                          value={phase.phase}
                          onChange={(e) => handleRoadmapChange(i, 'phase', e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div className="w-36">
                        <label className="form-label">期間</label>
                        <input
                          value={phase.duration}
                          onChange={(e) => handleRoadmapChange(i, 'duration', e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">タスク（1行1タスク）</label>
                      <textarea
                        value={phase.tasks.join('\n')}
                        onChange={(e) => handleRoadmapChange(i, 'tasks', e.target.value.split('\n'))}
                        rows={3}
                        className="form-textarea"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
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
                <><Save size={16} />事業計画を完成させる</>
              )}
            </button>
          )}

        </div>
      </main>
    </div>
  );
}
