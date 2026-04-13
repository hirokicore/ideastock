export type TimeSlot = '今日' | '今週' | '今月' | 'いつか';
export type TaskStatus = 'todo' | 'doing' | 'done';

export type ExecutionTask = {
  id:             string;
  user_id:        string;
  source_plan_id: string | null;
  source_idea_id: string | null;
  title:          string;
  description:    string;
  time_slot:      TimeSlot;
  status:         TaskStatus;
  result:         string;
  learning:       string;
  created_at:     string;
};

export type TaskGenerateItem = {
  title:       string;
  description: string;
  time_slot:   TimeSlot;
};
