-- Switch default model to OpenRouter Nemotron; reset quota ledger for new provider limits.

alter table public.content_candidates
  alter column model set default 'nvidia/nemotron-3-ultra-550b-a55b:free';

truncate table public.ai_curation_calls;
