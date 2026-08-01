import { describe, expect, it } from 'vitest';
import { gamesConfig, getGameConfig, getGamesByCategory, getFeaturedGames } from '../games';

describe('games config', () => {
  it('includes whack-a-mole game metadata', () => {
    const game = getGameConfig('whack-a-mole');

    expect(game).toBeDefined();
    expect(game?.category).toBe('arcade');
    expect(game?.featured).toBe(true);
    expect(game?.seo.en.title).toContain('Whack');
  });

  it('returns whack-a-mole in arcade and featured lists', () => {
    const arcadeSlugs = getGamesByCategory('arcade').map(game => game.slug);
    const featuredSlugs = getFeaturedGames().map(game => game.slug);

    expect(arcadeSlugs).toContain('whack-a-mole');
    expect(featuredSlugs).toContain('whack-a-mole');
  });

  it('keeps unique slugs', () => {
    const slugs = gamesConfig.map(game => game.slug);
    const unique = new Set(slugs);

    expect(unique.size).toBe(slugs.length);
  });
});
