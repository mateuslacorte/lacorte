-- Exclusive lease so only one worker invocation calls OpenRouter per job.

alter table public.content_curation_jobs
  add column if not exists locked_until timestamptz;

create index if not exists content_curation_jobs_locked_until_idx
  on public.content_curation_jobs (locked_until)
  where status in ('pending', 'running');

create or replace function public.claim_curation_job(
  p_job_id uuid,
  p_lease_seconds integer default 240
)
returns setof public.content_curation_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.content_curation_jobs
  set
    status = 'running',
    locked_until = now() + make_interval(secs => p_lease_seconds),
    updated_at = now()
  where id = p_job_id
    and status in ('pending', 'running')
    and (locked_until is null or locked_until < now())
  returning *;
end;
$$;

revoke all on function public.claim_curation_job(uuid, integer) from public;
grant execute on function public.claim_curation_job(uuid, integer) to service_role;
grant execute on function public.claim_curation_job(uuid, integer) to authenticated;
