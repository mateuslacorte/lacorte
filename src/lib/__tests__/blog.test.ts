import { describe, expect, it } from 'vitest';
import { getAllPosts, getAllTags, getPostBySlug } from '@/lib/blog';

describe('blog content layer', () => {
  it('loads imported markdown posts from en/', () => {
    const posts = getAllPosts('en');
    expect(posts.length).toBeGreaterThanOrEqual(8);
    expect(posts.every((post) => post.lang === 'en')).toBe(true);
  });

  it('maps excerpt-compatible frontmatter to description', () => {
    const post = getPostBySlug('introduction', 'en');
    expect(post?.data.title).toBe('Hey there!');
    expect(post?.data.description).toContain('quick intro');
    expect(post?.data.tags).toContain('introduction');
  });

  it('uses /posts paths for internal post links', () => {
    const post = getPostBySlug('nestjs-backend-six-months-later', 'en');
    expect(post?.content).toContain('](/posts/nestjs-reference-backend)');
    expect(post?.content).not.toContain('](/blog/');
  });

  it('collects tags from all posts', () => {
    const tags = getAllTags('en');
    expect(tags).toContain('nestjs');
    expect(tags).toContain('portfolio');
  });
});
