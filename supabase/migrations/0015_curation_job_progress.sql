-- Durable progress for multi-step background curation (survives >300s wall clock).

alter table public.content_curation_jobs
  add column if not exists progress jsonb not null default '{}'::jsonb;
