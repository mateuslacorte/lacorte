-- lacorte.dev initial schema
-- Chat signaling, jobs directory, articles, per-user data, FX history.

-- ---------------------------------------------------------------------------
-- Anonymous chat room signaling (replaces Firebase RTDB `rooms`)
-- Messages themselves travel peer-to-peer over WebRTC; only room metadata
-- lives here. Field limits mirror the old firebase-database-rules.json.
-- ---------------------------------------------------------------------------
create table public.chat_rooms (
  id text primary key check (char_length(id) between 8 and 40),
  created_at bigint not null,
  host_peer_id text not null check (char_length(host_peer_id) <= 100),
  guest_peer_id text check (char_length(guest_peer_id) <= 100),
  expires_at bigint not null
);

alter table public.chat_rooms enable row level security;

create policy "chat_rooms_select" on public.chat_rooms
  for select using (true);
create policy "chat_rooms_insert" on public.chat_rooms
  for insert with check (expires_at > created_at);
create policy "chat_rooms_update" on public.chat_rooms
  for update using (true) with check (true);
create policy "chat_rooms_delete" on public.chat_rooms
  for delete using (true);

-- Realtime change feed for room subscriptions
alter publication supabase_realtime add table public.chat_rooms;

-- ---------------------------------------------------------------------------
-- Admin allowlist (magic-link users granted admin surfaces)
-- ---------------------------------------------------------------------------
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.admin_users enable row level security;

create policy "admin_users_select_self" on public.admin_users
  for select using (auth.uid() = user_id);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Jobs directory (link-only career sites; `jobs` is future-proofing)
-- ---------------------------------------------------------------------------
create table public.job_sites (
  id text primary key,
  name text not null,
  color text not null,
  url text not null,
  status text not null default 'link-only',
  job_count integer not null default 0,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.job_sites enable row level security;

create policy "job_sites_select" on public.job_sites
  for select using (true);
create policy "job_sites_admin_write" on public.job_sites
  for all using (public.is_admin()) with check (public.is_admin());

create table public.jobs (
  id bigint generated always as identity primary key,
  site_id text not null references public.job_sites (id) on delete cascade,
  title text not null,
  url text not null unique,
  location text,
  posted_at timestamptz,
  fetched_at timestamptz not null default now()
);

alter table public.jobs enable row level security;

create policy "jobs_select" on public.jobs
  for select using (true);

-- ---------------------------------------------------------------------------
-- Article aggregator: sources, cached items, per-user picks
-- ---------------------------------------------------------------------------
create table public.article_sources (
  id text primary key,
  name text not null,
  feed_url text not null,
  site_url text,
  category text not null default 'global',
  is_default boolean not null default false,
  created_by uuid references auth.users (id) on delete cascade
);

alter table public.article_sources enable row level security;

create policy "article_sources_select" on public.article_sources
  for select using (is_default or created_by = auth.uid());
create policy "article_sources_insert_own" on public.article_sources
  for insert with check (created_by = auth.uid() and is_default = false);
create policy "article_sources_delete_own" on public.article_sources
  for delete using (created_by = auth.uid());
create policy "article_sources_admin_write" on public.article_sources
  for all using (public.is_admin()) with check (public.is_admin());

create table public.articles (
  id bigint generated always as identity primary key,
  source_id text not null references public.article_sources (id) on delete cascade,
  title text not null,
  url text not null unique,
  summary text,
  published_at timestamptz,
  fetched_at timestamptz not null default now()
);

create index articles_source_published_idx on public.articles (source_id, published_at desc);

alter table public.articles enable row level security;

create policy "articles_select" on public.articles
  for select using (true);

create table public.article_picks (
  user_id uuid not null references auth.users (id) on delete cascade,
  article_url text not null,
  title text not null,
  source_name text,
  created_at timestamptz not null default now(),
  primary key (user_id, article_url)
);

alter table public.article_picks enable row level security;

create policy "article_picks_own" on public.article_picks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Per-user tool data (anonymous auth sessions)
-- ---------------------------------------------------------------------------
create table public.user_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  tool_slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, tool_slug)
);

alter table public.user_favorites enable row level security;

create policy "user_favorites_own" on public.user_favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.user_recent_tools (
  user_id uuid not null references auth.users (id) on delete cascade,
  tool_slug text not null,
  title text not null default '',
  icon text not null default '',
  visited_at timestamptz not null default now(),
  primary key (user_id, tool_slug)
);

alter table public.user_recent_tools enable row level security;

create policy "user_recent_tools_own" on public.user_recent_tools
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Global FX rate history (populated by Vercel cron via service role)
-- ---------------------------------------------------------------------------
create table public.fx_rates (
  id bigint generated always as identity primary key,
  base text not null,
  quote text not null,
  rate numeric not null,
  fetched_at timestamptz not null default now()
);

create index fx_rates_pair_idx on public.fx_rates (base, quote, fetched_at desc);

alter table public.fx_rates enable row level security;

create policy "fx_rates_select" on public.fx_rates
  for select using (true);
