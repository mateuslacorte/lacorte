-- Track RSS articles already fed into LLM curation (by canonical URL).

create table public.curation_consumed_articles (
  article_url text primary key,
  consumed_at timestamptz not null default now()
);

create index curation_consumed_articles_consumed_at_idx
  on public.curation_consumed_articles (consumed_at desc);

alter table public.curation_consumed_articles enable row level security;

create policy "curation_consumed_articles_admin" on public.curation_consumed_articles
  for all using (public.is_admin()) with check (public.is_admin());
