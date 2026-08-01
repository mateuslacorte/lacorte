-- Admin curation upserts consumed URLs; SELECT-only policy blocked inserts.

drop policy if exists "curation_consumed_articles_admin_select" on public.curation_consumed_articles;

create policy "curation_consumed_articles_admin" on public.curation_consumed_articles
  for all using (public.is_admin()) with check (public.is_admin());
