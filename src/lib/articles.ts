import type { SupabaseClient } from '@supabase/supabase-js';

const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
};

function decodeHtmlEntities(text: string): string {
  let decoded = text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    });

  return decoded.replace(/&([a-z]+);/gi, (entity, name: string) => {
    return NAMED_HTML_ENTITIES[name.toLowerCase()] ?? entity;
  });
}

/** Strip encoded/raw HTML and normalize whitespace for article cards and RSS ingest. */
export function sanitizeArticleText(
  value: string | null | undefined,
  maxLength = 500,
): string {
  if (!value) return '';

  let text = value;
  for (let pass = 0; pass < 2; pass += 1) {
    text = decodeHtmlEntities(text);
    text = text.replace(/<[^>]*>/g, ' ');
  }

  text = text.replace(/\s+/g, ' ').trim();
  if (maxLength > 0 && text.length > maxLength) {
    return `${text.slice(0, maxLength - 3)}...`;
  }
  return text;
}

export type ArticleCategory = 'global' | 'news' | 'tech-blog' | 'social';

export interface FeedSource {
  id: string;
  name: string;
  color: string;
  rssUrl?: string;
  directUrl: string;
  icon: string;
  description: string;
  type: 'rss' | 'link-only';
  category: ArticleCategory;
  isDefault: boolean;
}

export interface PickedArticle {
  id: string;
  title: string;
  link: string;
  description: string;
  memo?: string;
  addedAt: string;
}

export interface FeedArticle {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  sourceId: string;
  sourceColor: string;
  sourceCategory: ArticleCategory;
}

type SourceRow = {
  id: string;
  name: string;
  feed_url: string;
  site_url: string | null;
  category: string;
  is_default: boolean;
  color: string;
  icon: string;
  description: string;
};

export function mapSupabaseSource(row: SourceRow): FeedSource {
  return {
    id: row.id,
    name: row.name,
    color: row.color || '#666666',
    rssUrl: row.feed_url,
    directUrl: row.site_url ?? row.feed_url,
    icon: row.icon || '📰',
    description: row.description || row.name,
    type: 'rss',
    category: row.category as ArticleCategory,
    isDefault: row.is_default,
  };
}

export async function loadArticleSources(supabase: SupabaseClient): Promise<FeedSource[]> {
  const { data, error } = await supabase
    .from('article_sources')
    .select('id, name, feed_url, site_url, category, is_default, color, icon, description')
    .order('name');

  if (error || !data) {
    console.error('[articles] load sources failed:', error?.message);
    return [];
  }

  return data.map(mapSupabaseSource);
}

export async function loadFeedArticles(
  supabase: SupabaseClient,
  options: { sourceIds?: string[]; limit?: number } = {},
): Promise<FeedArticle[]> {
  const limit = options.limit ?? 120;
  let query = supabase
    .from('articles')
    .select(
      'id, title, url, summary, published_at, fetched_at, source_id, article_sources(name, color, category)',
    )
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (options.sourceIds?.length) {
    query = query.in('source_id', options.sourceIds);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error('[articles] load feed failed:', error?.message);
    return [];
  }

  return data.map((row) => {
    const source = Array.isArray(row.article_sources)
      ? row.article_sources[0]
      : row.article_sources;
    return {
      id: String(row.id),
      title: sanitizeArticleText(row.title, 0),
      link: row.url,
      description: sanitizeArticleText(row.summary),
      pubDate: row.published_at ?? row.fetched_at,
      source: source?.name ?? row.source_id,
      sourceId: row.source_id,
      sourceColor: source?.color ?? '#666666',
      sourceCategory: (source?.category ?? 'global') as ArticleCategory,
    };
  });
}

export async function loadArticlePicks(supabase: SupabaseClient): Promise<PickedArticle[]> {
  const { data, error } = await supabase
    .from('article_picks')
    .select('article_url, title, description, memo, created_at')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('[articles] load picks failed:', error?.message);
    return [];
  }

  return data.map((row) => ({
    id: row.article_url,
    title: row.title,
    link: row.article_url,
    description: row.description ?? '',
    memo: row.memo ?? undefined,
    addedAt: row.created_at,
  }));
}

const SOURCE_COLOR_PALETTE = [
  '#FF6600',
  '#AC130D',
  '#0A0A0A',
  '#00A562',
  '#FA0026',
  '#24292E',
  '#E50914',
  '#F38020',
  '#635BFF',
  '#2563EB',
  '#7C3AED',
  '#DB2777',
  '#0D9488',
  '#CA8A04',
  '#EA580C',
  '#4F46E5',
];

export const SOURCE_EMOJI_OPTIONS = [
  '📰', '📡', '🔶', '🦞', '👩‍💻', '💚', '📱', '🐙', '▲', '🎬',
  '☁️', '💳', '🚀', '⚡', '🔥', '💡', '🧠', '🛠️', '📦', '🌐',
  '🛰️', '🧪', '📊', '🔐', '🧩', '🎯', '📝', '🪄', '💎', '🌟',
];

/** Pick a vivid accent color (same style as built-in sources). */
export function randomSourceColor(): string {
  return SOURCE_COLOR_PALETTE[Math.floor(Math.random() * SOURCE_COLOR_PALETTE.length)]!;
}

export async function addCustomSource(
  supabase: SupabaseClient,
  input: {
    name: string;
    rssUrl: string;
    category: ArticleCategory;
    color?: string;
    icon?: string;
    description?: string;
  },
  userId: string,
): Promise<FeedSource | null> {
  const id = `custom-${Date.now()}`;
  const row = {
    id,
    name: input.name,
    feed_url: input.rssUrl,
    site_url: input.rssUrl.replace(/\/(feed|rss)\/?$/i, ''),
    category: input.category,
    is_default: false,
    created_by: userId,
    color: input.color || randomSourceColor(),
    icon: input.icon || '📰',
    description: input.description || 'User-added source',
  };

  const { error } = await supabase.from('article_sources').insert(row);
  if (error) {
    console.error('[articles] add source failed:', error.message);
    return null;
  }

  return mapSupabaseSource(row);
}

export async function deleteCustomSource(supabase: SupabaseClient, sourceId: string): Promise<boolean> {
  const { error } = await supabase.from('article_sources').delete().eq('id', sourceId).eq('is_default', false);
  if (error) {
    console.error('[articles] delete source failed:', error.message);
    return false;
  }
  return true;
}

export async function addArticlePick(
  supabase: SupabaseClient,
  input: { title: string; link: string; description: string; memo?: string },
  userId: string,
): Promise<PickedArticle | null> {
  const { error } = await supabase.from('article_picks').upsert(
    {
      user_id: userId,
      article_url: input.link,
      title: input.title || input.link,
      description: input.description || null,
      memo: input.memo || null,
    },
    { onConflict: 'user_id,article_url' },
  );

  if (error) {
    console.error('[articles] add pick failed:', error.message);
    return null;
  }

  return {
    id: input.link,
    title: input.title || input.link,
    link: input.link,
    description: input.description,
    memo: input.memo,
    addedAt: new Date().toISOString(),
  };
}

export async function deleteArticlePick(supabase: SupabaseClient, articleUrl: string): Promise<boolean> {
  const { error } = await supabase.from('article_picks').delete().eq('article_url', articleUrl);
  if (error) {
    console.error('[articles] delete pick failed:', error.message);
    return false;
  }
  return true;
}
