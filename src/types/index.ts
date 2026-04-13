export type SourcePlatform = 'Claude' | 'ChatGPT' | 'Perplexity' | 'Gemini' | 'Memo';
export type Intent = '商品化' | '検討中' | 'メモ';
export type RelatedProject = 'TrainerDocs' | 'IdeaStock' | 'その他';
export type PriorityCategory = '今すぐ' | '仕込み' | '挑戦';
export type TimeSlot = '今月' | '3ヶ月以内' | '半年〜' | 'いつか';

export type IdeaStock = {
  id: string;
  user_id: string;
  title: string;
  source_platform: SourcePlatform;
  raw_text: string;
  human_note?: string | null;
  intent: Intent;
  related_project: RelatedProject;
  priority_category?: PriorityCategory | null;
  time_slot?: TimeSlot | null;
  // AI generated
  summary?: string | null;
  tags: string[];
  idea_list: string[];
  product_formats: string[];
  impact_score?: number | null;
  difficulty_score?: number | null;
  continuity_score?: number | null;
  recommend_score?: number | null;
  recommend_reason?: string | null;
  spread_score?: number | null;
  cost_score?: number | null;
  related_ids?: string[];
  created_at: string;
};

export type SimilarCandidate = {
  id: string;
  title: string;
  summary: string | null;
  similarity_type: 'duplicate' | 'related';
  reason: string;
};

export type SimilarityResult = {
  candidates: SimilarCandidate[];
};

export type AnalysisResult = {
  summary: string;
  tags: string[];
  idea_list: string[];
  product_formats: string[];
  impact_score: number;
  difficulty_score: number;
  continuity_score: number;
  recommend_score: number;
  recommend_reason: string;
  intent: Intent;
  related_project: RelatedProject;
  priority_category: PriorityCategory;
  time_slot: TimeSlot;
  spread_score: number;
  cost_score: number;
};

export type RefineResult = {
  // 差分説明
  new_title: string;
  improved_summary: string;
  market_improvement: string;
  feasibility_improvement: string;
  continuity_improvement: string;
  key_changes: string[];
  // 保存用フィールド（AnalysisResult 互換）
  summary: string;
  tags: string[];
  idea_list: string[];
  product_formats: string[];
  impact_score: number;
  difficulty_score: number;
  continuity_score: number;
  recommend_score: number;
  recommend_reason: string;
  intent: Intent;
  related_project: RelatedProject;
  priority_category: PriorityCategory;
  time_slot: TimeSlot;
  spread_score: number;
  cost_score: number;
};

export type StockFormData = {
  title: string;
  source_platform: SourcePlatform | '';
  raw_text: string;
  human_note: string;
};
