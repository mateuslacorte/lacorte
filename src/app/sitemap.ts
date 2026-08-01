import type { MetadataRoute } from 'next';
import { getAllPosts, getAllTags } from '@/lib/blog';
import { gamesConfig } from '@/data/games';
import { toolsConfig } from '@/data/tools';
import { locales } from '@/i18n';
import { localizePath } from '@/i18n/urlUtils';
import { SITE_URL } from '@/lib/site';

const NOINDEX_PATHS = new Set(['/admin']);

const staticPages = [
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/posts',
  '/tools',
  '/games',
  '/projects',
  '/anonymous-chat',
  '/jobs',
  '/articles',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const path of staticPages) {
    if (NOINDEX_PATHS.has(path)) continue;
    for (const lang of locales) {
      entries.push({
        url: `${SITE_URL}${localizePath(path, lang)}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: path === '/' ? 1 : 0.8,
      });
    }
  }

  for (const tool of toolsConfig) {
    for (const lang of locales) {
      entries.push({
        url: `${SITE_URL}${localizePath(`/tools/${tool.slug}`, lang)}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  }

  for (const game of gamesConfig) {
    for (const lang of locales) {
      entries.push({
        url: `${SITE_URL}${localizePath(`/games/${game.slug}`, lang)}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  }

  for (const post of getAllPosts('en')) {
    for (const lang of locales) {
      entries.push({
        url: `${SITE_URL}${localizePath(`/posts/${post.slug}`, lang)}`,
        lastModified: post.data.updated ?? post.data.date,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  }

  for (const tag of getAllTags('en')) {
    for (const lang of locales) {
      entries.push({
        url: `${SITE_URL}${localizePath(`/posts/tag/${encodeURIComponent(tag)}`, lang)}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    }
  }

  return entries;
}
