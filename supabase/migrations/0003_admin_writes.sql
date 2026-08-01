-- Allow service-role cron inserts into fx_rates / articles / job_sites.
-- Service role bypasses RLS; this policy documents intent for authenticated admins too.

create policy "fx_rates_admin_insert" on public.fx_rates
  for insert with check (public.is_admin());

create policy "articles_admin_write" on public.articles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "jobs_admin_write" on public.jobs
  for all using (public.is_admin()) with check (public.is_admin());

-- Note: enable Anonymous sign-ins and Email OTP in the Supabase Auth dashboard.
-- Grant admin by inserting into admin_users after first magic-link login:
--   insert into public.admin_users (user_id) values ('YOUR_AUTH_USER_UUID');
