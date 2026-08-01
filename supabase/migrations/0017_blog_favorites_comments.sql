-- Blog post favorites (separate from tool favorites) + public comments.

create table if not exists public.user_blog_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  post_slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, post_slug)
);

alter table public.user_blog_favorites enable row level security;

drop policy if exists "user_blog_favorites_own" on public.user_blog_favorites;
create policy "user_blog_favorites_own" on public.user_blog_favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null,
  user_id uuid references auth.users (id) on delete set null,
  author_name text not null check (char_length(trim(author_name)) between 1 and 80),
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists blog_comments_post_slug_created_idx
  on public.blog_comments (post_slug, created_at desc);

alter table public.blog_comments enable row level security;

drop policy if exists "blog_comments_public_read" on public.blog_comments;
create policy "blog_comments_public_read" on public.blog_comments
  for select using (true);

drop policy if exists "blog_comments_auth_insert" on public.blog_comments;
create policy "blog_comments_auth_insert" on public.blog_comments
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "blog_comments_own_delete" on public.blog_comments;
create policy "blog_comments_own_delete" on public.blog_comments
  for delete using (auth.uid() = user_id);

grant select on public.blog_comments to anon, authenticated;
grant insert, delete on public.blog_comments to authenticated;
grant select, insert, update, delete on public.user_blog_favorites to authenticated;
