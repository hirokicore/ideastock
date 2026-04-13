export type PlanStatus = 'draft' | 'active' | 'archived';

export type RoadmapPhase = {
  phase: string;
  duration: string;
  tasks: string[];
};

export type BusinessPlan = {
  id: string;
  user_id: string;
  source_idea_id?: string | null;
  title: string;
  target_customer: string;
  value_proposition: string;
  revenue_model: string;
  roadmap: RoadmapPhase[];
  status: PlanStatus;
  created_at: string;
};

export type PlanFormData = {
  source_idea_id: string;
  title: string;
  target_customer: string;
  value_proposition: string;
  revenue_model: string;
};
