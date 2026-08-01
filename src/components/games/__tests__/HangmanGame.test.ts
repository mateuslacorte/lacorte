import { afterEach, describe, expect, it, vi } from 'vitest';
import { maskWord, pickRandomWord } from '../HangmanGame';

describe('HangmanGame helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('masks unguessed letters with underscores', () => {
    const guessedLetters = new Set(['A', 'E']);

    expect(maskWord('APPLE', guessedLetters)).toBe('A _ _ _ E');
  });

  it('picks a random word from the provided list', () => {
    const words = [
      { word: 'ALPHA', hint: { ko: 'A', en: 'A', ja: 'A' } },
      { word: 'BETA', hint: { ko: 'B', en: 'B', ja: 'B' } },
    ];

    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    expect(pickRandomWord(words)).toEqual(words[1]);
  });
});
