import { describe, expect, it } from 'vitest';
import { filterUnusedArticles } from '@/lib/content-curation/articles';
import type { RecentArticleInput } from '@/lib/content-curation/types';

const article = (url: string, title: string): RecentArticleInput => ({
  url,
  title,
  sourceId: 'hackernews',
  summary: null,
  publishedAt: '2026-07-27T00:00:00.000Z',
});

describe('filterUnusedArticles', () => {
  it('returns only articles whose URLs were not consumed', () => {
    const articles = [
      article('https://example.com/a', 'A'),
      article('https://example.com/b', 'B'),
      article('https://example.com/c', 'C'),
    ];
    const used = new Set(['https://example.com/a', 'https://example.com/c']);

    expect(filterUnusedArticles(articles, used)).toEqual([article('https://example.com/b', 'B')]);
  });

  it('returns empty when every article was already used', () => {
    const articles = [article('https://example.com/a', 'A')];
    const used = new Set(['https://example.com/a']);

    expect(filterUnusedArticles(articles, used)).toEqual([]);
  });
});
