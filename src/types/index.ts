export type SourcePlatform = 'Claude' | 'ChatGPT' | 'Perplexity' | 'Gemini' | 'Memo';
export type Intent = '商品化' | '検討中' | 'メモ';
export type RelatedProject = 'TrainerDocs' | 'IdeaStock' | 'その他';

export type IdeaStock = {
  id: string;
  user_id: string;
  title: string;
  source_platform: SourcePlatform;
  raw_text: string;
  human_note?: string | null;
  intent: Intent;
  related_project: RelatedProject;
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
  created_at: string;
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
};

export type StockFormData = {
  title: string;
  source_platform: SourcePlatform | '';
  raw_text: string;
  human_note: string;
};
