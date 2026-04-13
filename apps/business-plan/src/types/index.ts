export type PlanStatus = 'draft' | 'active' | 'archived';
export type PlanType   = 'mvp'   | 'full';

export type RoadmapPhase = {
  phase:    string;
  duration: string;
  tasks:    string[];
};

export type IdeaSnapshot = {
  id:              string;
  title:           string;
  summary:         string | null;
  tags:            string[];
  idea_list:       string[];
  recommend_score: number | null;
};

export type BusinessPlan = {
  id:            string;
  user_id:       string;
  source_idea_id?: string | null;
  title:         string;
  plan_type:     PlanType;
  // MVP fields
  mvp_pain_point:   string;
  mvp_core_feature: string;
  mvp_acquisition:  string;
  mvp_monetization: string;
  // Full fields
  target_customer:    string;
  value_proposition:  string;
  revenue_model:      string;
  competitor_analysis: string;
  expansion_strategy: string;
  roadmap:            RoadmapPhase[];
  // Snapshot
  idea_snapshot: IdeaSnapshot | null;
  status:        PlanStatus;
  created_at:    string;
};

export type MvpGenerateResult = {
  title:            string;
  mvp_pain_point:   string;
  mvp_core_feature: string;
  mvp_acquisition:  string;
  mvp_monetization: string;
  idea_snapshot:    IdeaSnapshot;
};

export type FullGenerateResult = {
  target_customer:     string;
  value_proposition:   string;
  revenue_model:       string;
  competitor_analysis: string;
  expansion_strategy:  string;
  roadmap:             RoadmapPhase[];
};
