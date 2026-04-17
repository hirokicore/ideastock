'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, ChevronRight, ChevronLeft, Save } from 'lucide-react';
import type { SourcePlatform, Intent, RelatedProject, PriorityCategory, TimeSlot, OperationType } from '@/types';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
type Step = 'input' | 'process' | 'score' | 'confirm';

type FormState = {
  // Step 1: 入力
  title: string;
  source_platform: SourcePlatform | '';
  raw_text: string;
  human_note: string;
  // Step 2: 軽処理（人間 or 外部AI）
  summary: string;
  tags: string;            // カンマ区切りで入力
  idea_list: string;       // 改行区切り
  intent: Intent | '';
  related_project: RelatedProject | '';
  operation_type: OperationType | '';
  // Step 3: スコア（外部AI + 人間判断）
  impact_score: string;
  difficulty_score: string;
  continuity_score: string;
  placement_score: string;
  mental_score: string;
  revenue_score: string;
  priority_category: PriorityCategory | '';
  time_slot: TimeSlot | '';
};

const INITIAL: FormState = {
  title: '', source_platform: '', raw_text: '', human_note: '',
  summary: '', tags: '', idea_list: '',
  intent: '', related_project: '', operation_type: '',
  impact_score: '', difficulty_score: '', continuity_score: '',
  placement_score: '', mental_score: '', revenue_score: '',
  priority_category: '', time_slot: '',
};

// ──────────────────────────────────────────────
// Prompt templates
// ──────────────────────────────────────────────
function summaryTagPrompt(raw: string) {
  return `以下のテキストから、次の2つを出力してください。

【要約】2〜3文で本質を圧縮してください。
【タグ】関連キーワードを5〜8個、カンマ区切りで列挙してください。

---
${raw || '（テキストをStep 1に入力してください）'}
---`;
}

function ideaListPrompt(title: string, summary: string) {
  return `以下のアイデアから派生する具体的な展開・活用方法を3〜5個、箇条書きで列挙してください。

タイトル：${title || '（未入力）'}
要約：${summary || '（未入力）'}`;
}

function scorePrompt(title: string, summary: string) {
  return `以下のアイデアを1〜5のスコアで評価し、各行を「スコア名: 数値 // 理由」の形式で出力してください。

- impact_score　　: 市場規模・影響の大きさ（5が最大）
- difficulty_score: 実現難易度（5が最も難しい）
- continuity_score: 事業継続性・習慣化しやすさ（5が高い）
- placement_score : 放置しても継続する度合い（5が最も放置型）
- mental_score　　: 心理的な軽さ（5が最もストレスフリー）
- revenue_score　　: 収益ポテンシャル（5が最も高い）

アイデア：${title || '（未入力）'}
要約：${summary || '（未入力）'}`;
}

// ──────────────────────────────────────────────
// Components
// ──────────────────────────────────────────────
function PromptCard({ label, prompt }: { label: string; prompt: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: '#4a4678', backgroundColor: '#1a1826' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-brand-600">{label}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors"
          style={{ backgroundColor: '#2e2b50', color: '#a8a4cc' }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'コピー済み' : 'コピー'}
        </button>
      </div>
      <pre className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: '#8e8ab4', maxHeight: 160, overflow: 'auto' }}>
        {prompt}
      </pre>
    </div>
  );
}

function ScoreInput({ label, name, value, onChange }: {
  label: string; name: keyof FormState; value: string;
  onChange: (name: keyof FormState, v: string) => void;
}) {
  return (
    <div>
      <label className="form-label text-xs">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(name, String(n))}
            className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
              value === String(n)
                ? 'bg-brand-400 text-white'
                : 'text-gray-500 hover:bg-brand-50'
            }`}
            style={value !== String(n) ? { backgroundColor: '#2e2b50' } : {}}
          >
            {n}
          </button>
        ))}
        {value && (
          <button type="button" onClick={() => onChange(name, '')} className="text-xs text-gray-400 ml-1">✕</button>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────
export default function LiteNewPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('input');
  const [form, setForm] = useState<FormState>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.raw_text.trim()) {
      setError('タイトルと生テキストは必須です');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        source_platform: form.source_platform || 'Memo',
        raw_text: form.raw_text,
        human_note: form.human_note || null,
        summary: form.summary || null,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        idea_list: form.idea_list ? form.idea_list.split('\n').map((s) => s.trim()).filter(Boolean) : [],
        product_formats: [],
        intent: form.intent || '検討中',
        related_project: form.related_project || 'その他',
        operation_type: form.operation_type || null,
        priority_category: form.priority_category || null,
        time_slot: form.time_slot || null,
        impact_score: form.impact_score ? Number(form.impact_score) : null,
        difficulty_score: form.difficulty_score ? Number(form.difficulty_score) : null,
        continuity_score: form.continuity_score ? Number(form.continuity_score) : null,
        placement_score: form.placement_score ? Number(form.placement_score) : null,
        mental_score: form.mental_score ? Number(form.mental_score) : null,
        revenue_score: form.revenue_score ? Number(form.revenue_score) : null,
        related_ids: [],
      };
      const res = await fetch('/api/stocks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).error);
      router.push('/lite/stocks');
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const STEPS: { key: Step; label: string }[] = [
    { key: 'input',   label: '① 入力' },
    { key: 'process', label: '② 軽処理' },
    { key: 'score',   label: '③ スコア' },
    { key: 'confirm', label: '④ 確認' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">新規入力（Lite）</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map(({ key, label }, i) => (
          <div key={key} className="flex items-center gap-2">
            <button
              onClick={() => setStep(key)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                step === key ? 'bg-brand-400 text-white' : 'text-gray-500 hover:bg-brand-50'
              }`}
              style={step !== key ? { backgroundColor: '#2e2b50' } : {}}
            >
              {label}
            </button>
            {i < STEPS.length - 1 && <ChevronRight size={14} className="text-gray-400" />}
          </div>
        ))}
      </div>

      {/* ── Step 1: 入力 ── */}
      {step === 'input' && (
        <div className="space-y-5 rounded-2xl border p-6" style={{ backgroundColor: '#252240', borderColor: '#3a3660' }}>
          <p className="text-xs text-gray-500">テキストと基本情報を入力してください。分析はあとの段階で行います。</p>

          <div>
            <label className="form-label">タイトル <span className="text-red-600">*</span></label>
            <input className="form-input" value={form.title} onChange={(e) => set('title', e.target.value)}
              placeholder="アイデアのタイトルを自分で書いてください" />
          </div>

          <div>
            <label className="form-label">ソース</label>
            <select className="form-select" value={form.source_platform} onChange={(e) => set('source_platform', e.target.value as SourcePlatform)}>
              <option value="">選択してください</option>
              {(['Claude', 'ChatGPT', 'Perplexity', 'Gemini', 'Memo'] as SourcePlatform[]).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">生テキスト <span className="text-red-600">*</span></label>
            <textarea className="form-textarea" rows={6} value={form.raw_text} onChange={(e) => set('raw_text', e.target.value)}
              placeholder="AIとの会話ログやメモをそのまま貼り付けてください" />
          </div>

          <div>
            <label className="form-label">自分メモ（オプション）</label>
            <textarea className="form-textarea" rows={2} value={form.human_note} onChange={(e) => set('human_note', e.target.value)}
              placeholder="このアイデアに対する自分の補足・感想" />
          </div>

          <div className="flex justify-end">
            <button onClick={() => setStep('process')} disabled={!form.title.trim() || !form.raw_text.trim()}
              className="btn-primary text-sm">
              次へ（軽処理） <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: 軽処理 ── */}
      {step === 'process' && (
        <div className="space-y-5 rounded-2xl border p-6" style={{ backgroundColor: '#252240', borderColor: '#3a3660' }}>
          <p className="text-xs text-gray-500">
            下のプロンプトをChatGPT/Claudeに渡し、結果をフォームに貼り付けてください。
            スキップしてStep 4に進んでも保存できます。
          </p>

          <PromptCard label="① 要約 + タグ生成プロンプト" prompt={summaryTagPrompt(form.raw_text)} />

          <div>
            <label className="form-label">要約（AI出力を貼り付け）</label>
            <textarea className="form-textarea" rows={3} value={form.summary} onChange={(e) => set('summary', e.target.value)}
              placeholder="2〜3文の要約を貼り付けてください" />
          </div>

          <div>
            <label className="form-label">タグ（カンマ区切り）</label>
            <input className="form-input" value={form.tags} onChange={(e) => set('tags', e.target.value)}
              placeholder="SaaS, フィットネス, 自動化" />
          </div>

          <PromptCard label="② アイデア展開プロンプト" prompt={ideaListPrompt(form.title, form.summary)} />

          <div>
            <label className="form-label">アイデア展開（1行1案）</label>
            <textarea className="form-textarea" rows={4} value={form.idea_list} onChange={(e) => set('idea_list', e.target.value)}
              placeholder="展開アイデアを1行ずつ貼り付けてください" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">用途</label>
              <select className="form-select" value={form.intent} onChange={(e) => set('intent', e.target.value as Intent)}>
                <option value="">未設定</option>
                <option value="商品化">商品化</option>
                <option value="検討中">検討中</option>
                <option value="メモ">メモ</option>
              </select>
            </div>
            <div>
              <label className="form-label">関連PJ</label>
              <select className="form-select" value={form.related_project} onChange={(e) => set('related_project', e.target.value as RelatedProject)}>
                <option value="">未設定</option>
                <option value="TrainerDocs">TrainerDocs</option>
                <option value="IdeaStock">IdeaStock</option>
                <option value="その他">その他</option>
              </select>
            </div>
            <div>
              <label className="form-label">運営タイプ</label>
              <select className="form-select" value={form.operation_type} onChange={(e) => set('operation_type', e.target.value as OperationType)}>
                <option value="">未設定</option>
                <option value="放置型">放置型</option>
                <option value="営業型">営業型</option>
                <option value="ハイブリッド">ハイブリッド</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep('input')} className="btn-secondary text-sm">
              <ChevronLeft size={16} /> 戻る
            </button>
            <button onClick={() => setStep('score')} className="btn-primary text-sm">
              次へ（スコア） <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: スコア ── */}
      {step === 'score' && (
        <div className="space-y-5 rounded-2xl border p-6" style={{ backgroundColor: '#252240', borderColor: '#3a3660' }}>
          <p className="text-xs text-gray-500">
            プロンプトをAIに渡してスコアを取得するか、自分で直接判断して入力してください。
          </p>

          <PromptCard label="スコアリングプロンプト" prompt={scorePrompt(form.title, form.summary)} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ScoreInput label="インパクト（市場規模）" name="impact_score" value={form.impact_score} onChange={set} />
            <ScoreInput label="難易度（5=最難）" name="difficulty_score" value={form.difficulty_score} onChange={set} />
            <ScoreInput label="継続性" name="continuity_score" value={form.continuity_score} onChange={set} />
            <ScoreInput label="放置度（5=放置型）" name="placement_score" value={form.placement_score} onChange={set} />
            <ScoreInput label="心理的軽さ" name="mental_score" value={form.mental_score} onChange={set} />
            <ScoreInput label="収益ポテンシャル" name="revenue_score" value={form.revenue_score} onChange={set} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">優先カテゴリ</label>
              <select className="form-select" value={form.priority_category} onChange={(e) => set('priority_category', e.target.value as PriorityCategory)}>
                <option value="">未設定</option>
                <option value="今すぐ">今すぐ</option>
                <option value="仕込み">仕込み</option>
                <option value="挑戦">挑戦</option>
              </select>
            </div>
            <div>
              <label className="form-label">時期</label>
              <select className="form-select" value={form.time_slot} onChange={(e) => set('time_slot', e.target.value as TimeSlot)}>
                <option value="">未設定</option>
                <option value="今月">今月</option>
                <option value="3ヶ月以内">3ヶ月以内</option>
                <option value="半年〜">半年〜</option>
                <option value="いつか">いつか</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep('process')} className="btn-secondary text-sm">
              <ChevronLeft size={16} /> 戻る
            </button>
            <button onClick={() => setStep('confirm')} className="btn-primary text-sm">
              確認へ <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: 確認 ── */}
      {step === 'confirm' && (
        <div className="space-y-5 rounded-2xl border p-6" style={{ backgroundColor: '#252240', borderColor: '#3a3660' }}>
          <h2 className="text-sm font-bold text-gray-700">入力内容の確認</h2>

          <div className="space-y-3 text-sm">
            {[
              ['タイトル', form.title],
              ['ソース', form.source_platform || '未設定'],
              ['要約', form.summary || '（未入力）'],
              ['タグ', form.tags || '（未入力）'],
              ['用途', form.intent || '未設定'],
              ['関連PJ', form.related_project || '未設定'],
              ['運営タイプ', form.operation_type || '未設定'],
              ['優先カテゴリ', form.priority_category || '未設定'],
              ['時期', form.time_slot || '未設定'],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3">
                <span className="text-gray-400 w-28 flex-shrink-0">{label}</span>
                <span className="text-gray-700">{value}</span>
              </div>
            ))}
            <div className="flex gap-3">
              <span className="text-gray-400 w-28 flex-shrink-0">スコア</span>
              <span className="text-gray-700">
                影{form.impact_score || '–'} / 難{form.difficulty_score || '–'} / 継{form.continuity_score || '–'} / 放{form.placement_score || '–'} / 心{form.mental_score || '–'} / 収{form.revenue_score || '–'}
              </span>
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-between">
            <button onClick={() => setStep('score')} className="btn-secondary text-sm">
              <ChevronLeft size={16} /> 戻る
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? '保存中...' : <><Save size={16} /> 保存する</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
