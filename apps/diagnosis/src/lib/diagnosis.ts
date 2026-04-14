import typesData from '@/data/types.json';

export type DiagnosisType = {
  id: number;
  name: string;
  emoji: string;
  catchphrase: string;
  description: string;
  selfcare_tips: string[];
  shareable_text: string;
};

// タイプごとの背景グラデーション（Tailwindクラス）
export const TYPE_GRADIENTS: Record<number, string> = {
  0: 'from-violet-500 to-purple-700',
  1: 'from-pink-400 to-rose-500',
  2: 'from-amber-400 to-orange-500',
  3: 'from-red-500 to-rose-600',
  4: 'from-teal-400 to-cyan-600',
  5: 'from-blue-500 to-indigo-600',
  6: 'from-emerald-500 to-green-600',
  7: 'from-sky-400 to-blue-500',
};

// タイプごとのアクセントカラー（テキスト・ボーダー用）
export const TYPE_ACCENTS: Record<number, string> = {
  0: 'text-violet-600 border-violet-200 bg-violet-50',
  1: 'text-rose-600 border-rose-200 bg-rose-50',
  2: 'text-amber-600 border-amber-200 bg-amber-50',
  3: 'text-red-600 border-red-200 bg-red-50',
  4: 'text-teal-600 border-teal-200 bg-teal-50',
  5: 'text-blue-600 border-blue-200 bg-blue-50',
  6: 'text-emerald-600 border-emerald-200 bg-emerald-50',
  7: 'text-sky-600 border-sky-200 bg-sky-50',
};

/**
 * 誕生日の全数字を合計し、8で割った余りでタイプを決定する。
 * 例: "1990-05-23" → 1+9+9+0+0+5+2+3 = 29 → 29 % 8 = 5 → Type 5
 */
export function diagnose(birthday: string): DiagnosisType {
  const digits = birthday.replace(/-/g, '').split('');
  const total = digits.reduce((sum, ch) => sum + parseInt(ch, 10), 0);
  const idx = total % 8;
  return typesData[idx] as DiagnosisType;
}
