-- Content curation: LLM-generated blog ideas from RSS headlines.

create table public.content_candidates (
  id text primary key,
  title text not null,
  topic text not null,
  score int not null check (score >= 0 and score <= 100),
  status text not null check (status in ('ready', 'researching', 'hold', 'published', 'rejected')),
  action text not null check (action in ('new-post', 'update-existing', 'series', 'skip')),
  reason text not null,
  markdown_post text not null default '',
  input_prompt text not null default '',
  raw_output text not null default '',
  source_titles jsonb not null default '[]'::jsonb,
  model text not null default 'nvidia/nemotron-3-ultra-550b-a55b:free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index content_candidates_score_idx on public.content_candidates (score desc);
create index content_candidates_created_idx on public.content_candidates (created_at desc);

create table public.ai_curation_calls (
  id bigint generated always as identity primary key,
  called_at timestamptz not null default now(),
  trigger text not null check (trigger in ('cron', 'manual')),
  success boolean not null,
  error text
);

create index ai_curation_calls_called_at_idx on public.ai_curation_calls (called_at desc);

alter table public.content_candidates enable row level security;
alter table public.ai_curation_calls enable row level security;

create policy "content_candidates_admin" on public.content_candidates
  for all using (public.is_admin()) with check (public.is_admin());

create policy "ai_curation_calls_admin_select" on public.ai_curation_calls
  for select using (public.is_admin());

create policy "ai_curation_calls_admin_insert" on public.ai_curation_calls
  for insert with check (public.is_admin());
