export type SourcePlatform = 'Claude' | 'ChatGPT' | 'Perplexity' | 'Gemini' | 'Memo';
export type Intent = '商品化' | '検討中' | 'メモ';
export type PriorityCategory = '今すぐ' | '仕込み' | '挑戦';
export type TimeSlot = '今月' | '3ヶ月以内' | '半年〜' | 'いつか';

export interface IdeaStockLite {
  id: string;
  user_id: string;
  created_at: string;

  // idea
  title: string;
  raw_text: string;
  summary: string | null;
  tags: string[];
  source_platform: SourcePlatform;
  human_note: string | null;

  // evaluation (6軸のみ)
  impact_score: number | null;
  difficulty_score: number | null;
  continuity_score: number | null;
  placement_score: number | null;
  mental_score: number | null;
  revenue_score: number | null;

  // planning
  intent: Intent | null;
  related_project: string | null; // 固定unionにせず自由入力も許容
  priority_category: PriorityCategory | null;
  time_slot: TimeSlot | null;

  // relations
  related_ids: string[];
}

export interface AnalyzeLiteResult {
  title: string;
  summary: string;
  tags: string[];
  impact_score: number;
  difficulty_score: number;
  continuity_score: number;
  placement_score: number;
  mental_score: number;
  revenue_score: number;
}
