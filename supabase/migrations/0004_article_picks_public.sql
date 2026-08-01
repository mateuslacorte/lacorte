-- Extend article picks and allow public read of admin-curated content.

alter table public.article_picks
  add column if not exists description text,
  add column if not exists memo text;

drop policy if exists "article_picks_own" on public.article_picks;

create policy "article_picks_select" on public.article_picks
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.admin_users au
      where au.user_id = article_picks.user_id
    )
  );

create policy "article_picks_insert_own" on public.article_picks
  for insert with check (auth.uid() = user_id);

create policy "article_picks_update_own" on public.article_picks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "article_picks_delete_own" on public.article_picks
  for delete using (auth.uid() = user_id);

drop policy if exists "article_sources_select" on public.article_sources;

create policy "article_sources_select" on public.article_sources
  for select using (
    is_default
    or created_by = auth.uid()
    or exists (
      select 1 from public.admin_users au
      where au.user_id = article_sources.created_by
    )
  );
