'use client';

import { useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import type { Intent, RelatedProject, PriorityCategory, TimeSlot } from '@/types';

const INTENTS: Intent[] = ['商品化', '検討中', 'メモ'];
const RELATED_PROJECTS: RelatedProject[] = ['TrainerDocs', 'IdeaStock', 'その他'];
const PRIORITY_CATEGORIES: PriorityCategory[] = ['A', 'B', 'C'];
const TIME_SLOTS: TimeSlot[] = ['今月', '3ヶ月以内', '半年〜', 'いつか'];

export function intentStyle(v: string) {
  if (v === '商品化') return 'bg-green-100 text-green-700';
  if (v === '検討中') return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-600';
}

export function priorityStyle(v: string) {
  if (v === 'A') return 'bg-red-100 text-red-700';
  if (v === 'B') return 'bg-blue-100 text-blue-700';
  if (v === 'C') return 'bg-purple-100 text-purple-700';
  return 'bg-gray-100 text-gray-500';
}

export function timeSlotStyle(v: string) {
  if (v === '今月') return 'bg-red-50 text-red-600';
  if (v === '3ヶ月以内') return 'bg-orange-50 text-orange-600';
  if (v === '半年〜') return 'bg-yellow-50 text-yellow-700';
  return 'bg-gray-100 text-gray-500';
}

function ToggleGroup<T extends string>({
  label, options, value, onChange, styleFor,
}: {
  label: string;
  options: T[];
  value: T | null;
  onChange: (v: T) => void;
  styleFor?: (v: string) => string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = opt === value;
          const base = styleFor ? styleFor(opt) : 'bg-gray-100 text-gray-600';
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`badge cursor-pointer transition-all border ${
                active
                  ? `${base} ring-2 ring-offset-1 ring-brand-400 font-semibold`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function StockMeta({
  stockId,
  initialIntent,
  initialRelatedProject,
  initialPriorityCategory,
  initialTimeSlot,
  sourcePlatform,
  title,
  humanNote,
  createdAt,
}: {
  stockId: string;
  initialIntent: Intent;
  initialRelatedProject: RelatedProject;
  initialPriorityCategory?: PriorityCategory | null;
  initialTimeSlot?: TimeSlot | null;
  sourcePlatform: string;
  title: string;
  humanNote?: string | null;
  createdAt: string;
}) {
  const [editing, setEditing] = useState(false);
  const [intent, setIntent] = useState<Intent>(initialIntent);
  const [relatedProject, setRelatedProject] = useState<RelatedProject>(initialRelatedProject);
  const [priorityCategory, setPriorityCategory] = useState<PriorityCategory | null>(initialPriorityCategory ?? null);
  const [timeSlot, setTimeSlot] = useState<TimeSlot | null>(initialTimeSlot ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const body: Record<string, string> = {
        intent,
        related_project: relatedProject,
      };
      if (priorityCategory) body.priority_category = priorityCategory;
      if (timeSlot) body.time_slot = timeSlot;

      const res = await fetch(`/api/stocks/${stockId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '保存に失敗しました');
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIntent(initialIntent);
    setRelatedProject(initialRelatedProject);
    setPriorityCategory(initialPriorityCategory ?? null);
    setTimeSlot(initialTimeSlot ?? null);
    setEditing(false);
    setError('');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="badge bg-brand-50 text-brand-600">{sourcePlatform}</span>

        {editing ? (
          <div className="flex flex-wrap gap-x-6 gap-y-4 flex-1 pt-1">
            <ToggleGroup label="用途" options={INTENTS} value={intent} onChange={setIntent} styleFor={intentStyle} />
            <ToggleGroup label="関連PJ" options={RELATED_PROJECTS} value={relatedProject} onChange={setRelatedProject} />
            <ToggleGroup label="カテゴリ" options={PRIORITY_CATEGORIES} value={priorityCategory} onChange={setPriorityCategory} styleFor={priorityStyle} />
            <ToggleGroup label="着手時期" options={TIME_SLOTS} value={timeSlot} onChange={setTimeSlot} styleFor={timeSlotStyle} />
          </div>
        ) : (
          <>
            <span className={`badge ${intentStyle(intent)}`}>{intent}</span>
            <span className="badge bg-gray-100 text-gray-500">{relatedProject}</span>
            {priorityCategory && (
              <span className={`badge font-bold ${priorityStyle(priorityCategory)}`}>
                {priorityCategory}
              </span>
            )}
            {timeSlot && (
              <span className={`badge ${timeSlotStyle(timeSlot)}`}>{timeSlot}</span>
            )}
          </>
        )}

        <span className="ml-auto text-xs text-gray-400 flex-shrink-0">{createdAt}</span>
      </div>

      <h1 className="text-xl font-bold text-gray-900 leading-snug">{title}</h1>

      {humanNote && (
        <p className="text-sm text-gray-500 italic border-l-2 border-brand-200 pl-3">
          {humanNote}
        </p>
      )}

      {/* Edit controls */}
      <div className="flex items-center gap-2 pt-1">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
            >
              {saving ? (
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check size={13} />
              )}
              保存
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-60 transition-colors"
            >
              <X size={13} />
              キャンセル
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Pencil size={13} />
            用途・カテゴリ・時期を編集
          </button>
        )}
        {saved && <span className="text-xs text-green-600 font-medium">保存しました</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}
