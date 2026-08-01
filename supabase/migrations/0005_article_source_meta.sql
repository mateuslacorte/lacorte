-- Store display metadata on article_sources so the UI has no hardcoded catalog.

alter table public.article_sources
  add column if not exists color text not null default '#666666',
  add column if not exists icon text not null default '📰',
  add column if not exists description text not null default '';

update public.article_sources set
  color = case id
    when 'hackernews' then '#FF6600'
    when 'ia-open-source' then '#4285F4'
    when 'devto' then '#0A0A0A'
    when 'techcrunch' then '#00A562'
    when 'theverge' then '#FA0026'
    when 'github-blog' then '#24292E'
    when 'vercel-blog' then '#000000'
    when 'netflix-tech' then '#E50914'
    when 'cloudflare-blog' then '#F38020'
    when 'stripe-blog' then '#635BFF'
    else color
  end,
  icon = case id
    when 'hackernews' then '🔶'
    when 'ia-open-source' then '🧠'
    when 'devto' then '👩‍💻'
    when 'techcrunch' then '💚'
    when 'theverge' then '📱'
    when 'github-blog' then '🐙'
    when 'vercel-blog' then '▲'
    when 'netflix-tech' then '🎬'
    when 'cloudflare-blog' then '☁️'
    when 'stripe-blog' then '💳'
    else icon
  end,
  description = case id
    when 'hackernews' then 'Y Combinator news'
    when 'ia-open-source' then 'AI and open source news from the last 24 hours'
    when 'devto' then 'Developer community'
    when 'techcrunch' then 'Tech news'
    when 'theverge' then 'Tech news and reviews'
    when 'github-blog' then 'GitHub official blog'
    when 'vercel-blog' then 'Vercel official blog'
    when 'netflix-tech' then 'Netflix engineering blog'
    when 'cloudflare-blog' then 'Cloudflare engineering blog'
    when 'stripe-blog' then 'Stripe engineering blog'
    else description
  end
where is_default = true;
