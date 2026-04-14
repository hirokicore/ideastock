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

// タイプごとの背景グラデーション（インラインスタイル用CSS値）
// ※ Tailwindクラスはlib/がスキャン対象外になる場合があるため inline style で指定
export const TYPE_GRADIENTS: Record<number, string> = {
  0: 'linear-gradient(135deg, #4c1d95, #6d28d9)', // violet
  1: 'linear-gradient(135deg, #9d174d, #be185d)', // rose
  2: 'linear-gradient(135deg, #78350f, #b45309)', // amber
  3: 'linear-gradient(135deg, #7f1d1d, #b91c1c)', // red
  4: 'linear-gradient(135deg, #134e4a, #0f766e)', // teal
  5: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', // blue
  6: 'linear-gradient(135deg, #14532d, #15803d)', // emerald
  7: 'linear-gradient(135deg, #0c4a6e, #0369a1)', // sky
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
