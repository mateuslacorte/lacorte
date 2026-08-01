-- Rename draft-prompt column to full-post storage.

alter table public.content_candidates
  rename column markdown_prompt to markdown_post;
