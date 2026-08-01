-- Replace Lobsters default source with Google News IA & Open Source feed.

delete from public.article_sources where id = 'lobsters';

insert into public.article_sources (
  id,
  name,
  feed_url,
  site_url,
  category,
  is_default,
  color,
  icon,
  description
) values (
  'ia-open-source',
  'IA & Open Source',
  'https://news.google.com/rss/search?q=%22artificial+intelligence%22+OR+%22open+source%22+when:1d+-jobs&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com',
  'news',
  true,
  '#4285F4',
  '🧠',
  'AI and open source news from the last 24 hours'
)
on conflict (id) do update set
  name = excluded.name,
  feed_url = excluded.feed_url,
  site_url = excluded.site_url,
  category = excluded.category,
  is_default = excluded.is_default,
  color = excluded.color,
  icon = excluded.icon,
  description = excluded.description;
