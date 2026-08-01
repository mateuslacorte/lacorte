'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from '../i18n/useTranslation';

interface GameState {
  target: number;
  attempts: number;
  maxAttempts: number;
  guesses: { value: number; hint: 'up' | 'down' | 'correct' }[];
  gameOver: boolean;
  won: boolean;
}

const generateTarget = () => Math.floor(Math.random() * 100) + 1;

export default function NumberGuess() {
  const { t } = useTranslation();
  const [game, setGame] = useState<GameState>({
    target: generateTarget(),
    attempts: 0,
    maxAttempts: 7,
    guesses: [],
    gameOver: false,
    won: false,
  });
  const [input, setInput] = useState('');
  const [stats, setStats] = useState({ played: 0, won: 0, avgAttempts: 0 });
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');

  const getDifficultySettings = (diff: typeof difficulty) => {
    switch (diff) {
      case 'easy':
        return { max: 50, attempts: 10, label: t({ en: 'Easy (1-50)', pt: 'Easy (1-50)' }) };
      case 'hard':
        return { max: 200, attempts: 5, label: t({ en: 'Hard (1-200)', pt: 'Hard (1-200)' }) };
      default:
        return { max: 100, attempts: 7, label: t({ en: 'Normal (1-100)', pt: 'Normal (1-100)' }) };
    }
  };

  const settings = getDifficultySettings(difficulty);

  const makeGuess = useCallback(() => {
    const guess = parseInt(input);
    if (isNaN(guess) || guess < 1 || guess > settings.max || game.gameOver) return;

    const newAttempts = game.attempts + 1;
    let hint: 'up' | 'down' | 'correct' = 'correct';
    let gameOver = false;
    let won = false;

    if (guess < game.target) {
      hint = 'up';
    } else if (guess > game.target) {
      hint = 'down';
    } else {
      gameOver = true;
      won = true;
    }

    if (newAttempts >= game.maxAttempts && !won) {
      gameOver = true;
    }

    setGame((prev) => ({
      ...prev,
      attempts: newAttempts,
      guesses: [...prev.guesses, { value: guess, hint }],
      gameOver,
      won,
    }));

    if (gameOver) {
      setStats((prev) => ({
        played: prev.played + 1,
        won: prev.won + (won ? 1 : 0),
        avgAttempts: won
          ? (prev.avgAttempts * prev.won + newAttempts) / (prev.won + 1)
          : prev.avgAttempts,
      }));
    }

    setInput('');
  }, [input, game, settings.max]);

  const newGame = (newDifficulty?: typeof difficulty) => {
    const diff = newDifficulty || difficulty;
    const newSettings = getDifficultySettings(diff);
    setGame({
      target: Math.floor(Math.random() * newSettings.max) + 1,
      attempts: 0,
      maxAttempts: newSettings.attempts,
      guesses: [],
      gameOver: false,
      won: false,
    });
    setInput('');
    if (newDifficulty) setDifficulty(newDifficulty);
  };

  const getHintText = (hint: 'up' | 'down' | 'correct') => {
    if (hint === 'up') return t({ en: '⬆️ UP', pt: '⬆️ UP' });
    if (hint === 'down') return t({ en: '⬇️ DOWN', pt: '⬇️ DOWN' });
    return t({ en: '🎯 Correct!', pt: '🎯 Correct!' });
  };

  const getProximityColor = (guess: number) => {
    const diff = Math.abs(guess - game.target);
    const maxDiff = settings.max;
    const ratio = diff / maxDiff;

    if (ratio < 0.05) return 'border-green-500 bg-green-500/20';
    if (ratio < 0.1) return 'border-yellow-500 bg-yellow-500/20';
    if (ratio < 0.2) return 'border-orange-500 bg-orange-500/20';
    return 'border-red-500 bg-red-500/20';
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Difficulty selection */}
      <div className="flex justify-center gap-2 mb-6">
        {(['easy', 'normal', 'hard'] as const).map((diff) => (
          <button
            key={diff}
            onClick={() => newGame(diff)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              difficulty === diff
                ? 'bg-primary-500 text-white'
                : 'bg-[var(--color-card)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)]'
            }`}
          >
            {getDifficultySettings(diff).label}
          </button>
        ))}
      </div>

      {/* Game state */}
      <div className="bg-[var(--color-card)] rounded-xl p-6 border border-[var(--color-border)] mb-6">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🔢</div>
          <h2 className="text-xl font-bold mb-2">
            {t({ en: `Guess a number from 1 to ${settings.max}!`, pt: `Guess a number from 1 to ${settings.max}!` })}
          </h2>
          <p className="text-[var(--color-text-muted)]">
            {t({ en: 'Attempts left', pt: 'Attempts left' })}: <span className="font-bold text-primary-500">{game.maxAttempts - game.attempts}</span>
          </p>
        </div>

        {/* Input */}
        {!game.gameOver && (
          <div className="flex gap-2">
            <input
              type="number"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && makeGuess()}
              min={1}
              max={settings.max}
              placeholder={`1-${settings.max}`}
              className="flex-1 px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-xl font-bold"
            />
            <button
              onClick={makeGuess}
              disabled={!input}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg font-bold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t({ en: 'Submit', pt: 'Submit' })}
            </button>
          </div>
        )}

        {/* Game over */}
        {game.gameOver && (
          <div
            className={`text-center p-6 rounded-xl ${
              game.won
                ? 'bg-green-500/20 border border-green-500'
                : 'bg-red-500/20 border border-red-500'
            }`}
          >
            <div className="text-5xl mb-4">{game.won ? '🎉' : '😢'}</div>
            <h3 className="text-2xl font-bold mb-2">
              {game.won ? t({ en: 'Correct!', pt: 'Correct!' }) : t({ en: 'Game Over', pt: 'Game Over' })}
            </h3>
            <p className="text-[var(--color-text-muted)] mb-4">
              {game.won
                ? t({ en: `You got it in ${game.attempts} attempts!`, pt: `You got it in ${game.attempts} attempts!` })
                : t({ en: `The answer was ${game.target}`, pt: `The answer was ${game.target}` })}
            </p>
            <button
              onClick={() => newGame()}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg font-bold hover:bg-primary-600"
            >
              {t({ en: 'Play Again', pt: 'Play Again' })}
            </button>
          </div>
        )}
      </div>

      {/* Guess history */}
      {game.guesses.length > 0 && (
        <div className="bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)] mb-6">
          <h3 className="font-bold mb-4">{t({ en: 'Guess History', pt: 'Guess History' })}</h3>
          <div className="flex flex-wrap gap-2">
            {game.guesses.map((guess, index) => (
              <div
                key={index}
                className={`px-4 py-2 rounded-lg border-2 ${getProximityColor(guess.value)}`}
              >
                <span className="font-bold">{guess.value}</span>
                <span className="ml-2 text-sm">{getHintText(guess.hint)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)]">
        <h3 className="font-bold mb-4 text-center">{t({ en: '📊 Stats', pt: '📊 Stats' })}</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary-500">{stats.played}</div>
            <div className="text-sm text-[var(--color-text-muted)]">{t({ en: 'Played', pt: 'Played' })}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">
              {stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0}%
            </div>
            <div className="text-sm text-[var(--color-text-muted)]">{t({ en: 'Win Rate', pt: 'Win Rate' })}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-500">
              {stats.won > 0 ? stats.avgAttempts.toFixed(1) : '-'}
            </div>
            <div className="text-sm text-[var(--color-text-muted)]">{t({ en: 'Avg Attempts', pt: 'Avg Attempts' })}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
