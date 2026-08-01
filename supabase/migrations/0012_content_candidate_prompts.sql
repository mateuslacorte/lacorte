-- Store OpenRouter input prompt and raw assistant output per curation run.

alter table public.content_candidates
  add column input_prompt text not null default '',
  add column raw_output text not null default '';
