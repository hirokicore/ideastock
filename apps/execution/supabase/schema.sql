-- execution_tasks テーブル
create table if not exists public.execution_tasks (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  source_plan_id  uuid,       -- business_plans.id（任意）
  source_idea_id  uuid,       -- idea_stocks.id（任意）
  title           text        not null,
  description     text        not null default '',
  time_slot       text        not null default 'いつか'
                              check (time_slot in ('今日','今週','今月','いつか')),
  status          text        not null default 'todo'
                              check (status in ('todo','doing','done')),
  result          text        not null default '',
  learning        text        not null default '',
  created_at      timestamptz not null default now()
);

-- RLS
alter table public.execution_tasks enable row level security;

create policy "Users can manage their own tasks"
  on public.execution_tasks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- インデックス
create index if not exists execution_tasks_user_id_idx
  on public.execution_tasks (user_id);

create index if not exists execution_tasks_source_plan_id_idx
  on public.execution_tasks (source_plan_id)
  where source_plan_id is not null;

create index if not exists execution_tasks_time_slot_idx
  on public.execution_tasks (user_id, time_slot, status);
