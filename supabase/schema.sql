-- idea_stocks テーブル
create table if not exists public.idea_stocks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,

  -- 人間が入力するフィールド
  title            text not null,
  source_platform  text not null
                     check (source_platform in ('Claude','ChatGPT','Perplexity','Gemini','Memo')),
  raw_text         text not null,
  human_note       text,
  intent           text not null
                     check (intent in ('商品化','検討中','メモ')),
  related_project  text not null default 'その他'
                     check (related_project in ('TrainerDocs','IdeaStock','その他')),

  -- AI自動生成フィールド
  summary          text,
  tags             text[]    not null default '{}',
  idea_list        text[]    not null default '{}',
  product_formats  text[]    not null default '{}',
  impact_score     integer   check (impact_score between 1 and 5),
  difficulty_score integer   check (difficulty_score between 1 and 5),
  continuity_score integer   check (continuity_score between 1 and 5),
  recommend_score  integer   check (recommend_score between 0 and 100),
  recommend_reason text,
  priority_category text     check (priority_category in ('A','B','C')),
  time_slot         text     check (time_slot in ('今月','3ヶ月以内','半年〜','いつか')),
  spread_score      integer  check (spread_score between 1 and 3),
  cost_score        integer  check (cost_score between 1 and 3),

  created_at       timestamptz not null default now()
);

-- 既存テーブルへのカラム追加（初回構築後に実行）
-- Supabase Dashboard > SQL Editor で以下を実行してください:
--
-- alter table public.idea_stocks
--   add column if not exists priority_category text check (priority_category in ('A','B','C')),
--   add column if not exists time_slot         text check (time_slot in ('今月','3ヶ月以内','半年〜','いつか')),
--   add column if not exists spread_score      integer check (spread_score between 1 and 3),
--   add column if not exists cost_score        integer check (cost_score between 1 and 3);

-- RLS
alter table public.idea_stocks enable row level security;

create policy "Users can manage their own stocks"
  on public.idea_stocks
  for all
  to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
