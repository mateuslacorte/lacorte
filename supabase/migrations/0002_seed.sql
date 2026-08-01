-- Seed data: global job sites and default article sources.

insert into public.job_sites (id, name, color, url, status, sort_order) values
  ('google',    'Google',    '#4285F4', 'https://careers.google.com/jobs/results/',                'link-only', 1),
  ('meta',      'Meta',      '#0668E1', 'https://www.metacareers.com/jobs',                        'link-only', 2),
  ('amazon',    'Amazon',    '#FF9900', 'https://www.amazon.jobs/en/search?category=software-development', 'link-only', 3),
  ('microsoft', 'Microsoft', '#00A4EF', 'https://jobs.careers.microsoft.com/global/en/search',     'link-only', 4),
  ('apple',     'Apple',     '#555555', 'https://jobs.apple.com/en-us/search?team=software-and-services-SFTWR', 'link-only', 5),
  ('stripe',    'Stripe',    '#635BFF', 'https://stripe.com/jobs/search',                          'link-only', 6),
  ('github',    'GitHub',    '#24292F', 'https://www.github.careers/careers-home/jobs',            'link-only', 7),
  ('airbnb',    'Airbnb',    '#FF5A5F', 'https://careers.airbnb.com/positions/',                   'link-only', 8),
  ('shopify',   'Shopify',   '#96BF48', 'https://www.shopify.com/careers',                         'link-only', 9),
  ('vercel',    'Vercel',    '#000000', 'https://vercel.com/careers',                              'link-only', 10),
  ('netflix',   'Netflix',   '#E50914', 'https://explore.jobs.netflix.net/careers',                'link-only', 11),
  ('cloudflare','Cloudflare','#F48120', 'https://www.cloudflare.com/careers/jobs/',                'link-only', 12)
on conflict (id) do nothing;

insert into public.article_sources (id, name, feed_url, site_url, category, is_default) values
  ('hackernews',  'Hacker News',        'https://hnrss.org/frontpage',                       'https://news.ycombinator.com', 'global', true),
  ('ia-open-source', 'IA & Open Source', 'https://news.google.com/rss/search?q=%22artificial+intelligence%22+OR+%22open+source%22+when:1d+-jobs&hl=en-US&gl=US&ceid=US:en', 'https://news.google.com', 'news', true),
  ('devto',       'DEV.to',             'https://dev.to/feed',                               'https://dev.to',               'global', true),
  ('techcrunch',  'TechCrunch',         'https://techcrunch.com/feed/',                      'https://techcrunch.com',       'news',   true),
  ('theverge',    'The Verge',          'https://www.theverge.com/rss/index.xml',            'https://www.theverge.com',     'news',   true),
  ('github-blog', 'GitHub Blog',        'https://github.blog/feed/',                         'https://github.blog',          'tech-blog', true),
  ('vercel-blog', 'Vercel Blog',        'https://vercel.com/atom',                           'https://vercel.com/blog',      'tech-blog', true),
  ('netflix-tech','Netflix TechBlog',   'https://netflixtechblog.com/feed',                  'https://netflixtechblog.com',  'tech-blog', true),
  ('cloudflare-blog', 'Cloudflare Blog','https://blog.cloudflare.com/rss/',                  'https://blog.cloudflare.com',  'tech-blog', true),
  ('stripe-blog', 'Stripe Blog',        'https://stripe.com/blog/feed.rss',                  'https://stripe.com/blog',      'tech-blog', true)
on conflict (id) do nothing;
