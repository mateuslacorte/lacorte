-- Gemini 2.5 Flash discontinued; default new candidates to gemini-3.5-flash.

alter table public.content_candidates
  alter column model set default 'gemini-3.5-flash';
