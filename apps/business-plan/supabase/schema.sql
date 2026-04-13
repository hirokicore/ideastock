-- business_plans テーブル
create table if not exists public.business_plans (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  source_idea_id    uuid,       -- IdeaStock の idea_stocks.id（任意）
  title             text        not null,
  target_customer   text        not null default '',
  value_proposition text        not null default '',
  revenue_model     text        not null default '',
  roadmap           jsonb       not null default '[]',
  status            text        not null default 'draft'
                                check (status in ('draft','active','archived')),
  created_at        timestamptz not null default now()
);

-- RLS
alter table public.business_plans enable row level security;

create policy "Users can manage their own plans"
  on public.business_plans
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- インデックス
create index if not exists business_plans_user_id_idx
  on public.business_plans (user_id);

create index if not exists business_plans_source_idea_id_idx
  on public.business_plans (source_idea_id)
  where source_idea_id is not null;
