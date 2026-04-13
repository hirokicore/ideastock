-- business_plans テーブル
create table if not exists public.business_plans (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users(id) on delete cascade,
  source_idea_id      uuid,       -- IdeaStock の idea_stocks.id（任意）
  title               text        not null,
  plan_type           text        not null default 'mvp'
                                  check (plan_type in ('mvp','full')),
  -- MVP fields
  mvp_pain_point      text        not null default '',
  mvp_core_feature    text        not null default '',
  mvp_acquisition     text        not null default '',
  mvp_monetization    text        not null default '',
  -- Full fields
  target_customer     text        not null default '',
  value_proposition   text        not null default '',
  revenue_model       text        not null default '',
  competitor_analysis text        not null default '',
  expansion_strategy  text        not null default '',
  roadmap             jsonb       not null default '[]',
  -- Snapshot of original idea at plan creation time
  idea_snapshot       jsonb,
  status              text        not null default 'draft'
                                  check (status in ('draft','active','archived')),
  created_at          timestamptz not null default now()
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

-- Migration: add new columns to existing table
-- Run these if the table already exists without the new columns:
-- alter table public.business_plans add column if not exists plan_type text not null default 'mvp' check (plan_type in ('mvp','full'));
-- alter table public.business_plans add column if not exists mvp_pain_point text not null default '';
-- alter table public.business_plans add column if not exists mvp_core_feature text not null default '';
-- alter table public.business_plans add column if not exists mvp_acquisition text not null default '';
-- alter table public.business_plans add column if not exists mvp_monetization text not null default '';
-- alter table public.business_plans add column if not exists competitor_analysis text not null default '';
-- alter table public.business_plans add column if not exists expansion_strategy text not null default '';
-- alter table public.business_plans add column if not exists idea_snapshot jsonb;
