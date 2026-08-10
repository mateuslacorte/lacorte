-- Public link shortener: /s/{code} → target URL

create table if not exists public.short_links (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  target_url text not null,
  click_count bigint not null default 0,
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz,
  constraint short_links_code_format check (
    char_length(code) between 4 and 32
    and code ~ '^[a-zA-Z0-9_-]+$'
  ),
  constraint short_links_target_http check (
    target_url ~* '^https?://'
    and char_length(target_url) between 8 and 2048
  )
);

create unique index if not exists short_links_code_uidx on public.short_links (lower(code));

alter table public.short_links enable row level security;

-- Public may resolve by code (select); inserts/updates go through service role only.
drop policy if exists "short_links_public_read" on public.short_links;
create policy "short_links_public_read" on public.short_links
  for select using (true);

grant select on public.short_links to anon, authenticated;
-- No insert/update/delete for anon/authenticated — API uses service role.
