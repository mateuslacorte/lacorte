-- Background curation job ledger (enqueue + poll).

create table public.content_curation_jobs (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('pending', 'running', 'succeeded', 'failed')),
  trigger text not null check (trigger in ('cron', 'manual')),
  error text,
  candidate_id text references public.content_candidates (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz
);

create index content_curation_jobs_status_idx
  on public.content_curation_jobs (status, created_at desc);

alter table public.content_curation_jobs enable row level security;

create policy "content_curation_jobs_admin" on public.content_curation_jobs
  for all using (public.is_admin()) with check (public.is_admin());
