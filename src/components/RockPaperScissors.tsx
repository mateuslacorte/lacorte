'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from '../i18n/useTranslation';

type Choice = 'rock' | 'paper' | 'scissors';
type Result = 'win' | 'lose' | 'draw';

interface GameStats {
  wins: number;
  losses: number;
  draws: number;
}

const CHOICES: { id: Choice; emoji: string }[] = [
  { id: 'rock', emoji: '✊' },
  { id: 'paper', emoji: '✋' },
  { id: 'scissors', emoji: '✌️' },
];

const getWinner = (player: Choice, computer: Choice): Result => {
  if (player === computer) return 'draw';
  if (
    (player === 'rock' && computer === 'scissors') ||
    (player === 'paper' && computer === 'rock') ||
    (player === 'scissors' && computer === 'paper')
  ) {
    return 'win';
  }
  return 'lose';
};

export default function RockPaperScissors() {
  const { t } = useTranslation();
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [stats, setStats] = useState<GameStats>({ wins: 0, losses: 0, draws: 0 });
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  const getChoiceName = (id: Choice) => {
    switch (id) {
      case 'rock':
        return t({ en: 'Rock', pt: 'Rock' });
      case 'paper':
        return t({ en: 'Paper', pt: 'Paper' });
      case 'scissors':
        return t({ en: 'Scissors', pt: 'Scissors' });
    }
  };

  const play = useCallback((choice: Choice) => {
    if (isPlaying) return;

    setIsPlaying(true);
    setPlayerChoice(choice);
    setComputerChoice(null);
    setResult(null);

    // Countdown
    let count = 3;
    setCountdown(count);

    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        setCountdown(null);

        // Computer choice
        const compChoice = CHOICES[Math.floor(Math.random() * 3)].id;
        setComputerChoice(compChoice);

        // Calculate result
        const gameResult = getWinner(choice, compChoice);
        setResult(gameResult);

        // Update stats
        setStats((prev) => ({
          wins: prev.wins + (gameResult === 'win' ? 1 : 0),
          losses: prev.losses + (gameResult === 'lose' ? 1 : 0),
          draws: prev.draws + (gameResult === 'draw' ? 1 : 0),
        }));

        // Update win streak
        if (gameResult === 'win') {
          setStreak((prev) => {
            const newStreak = prev + 1;
            setMaxStreak((max) => Math.max(max, newStreak));
            return newStreak;
          });
        } else if (gameResult === 'lose') {
          setStreak(0);
        }

        setIsPlaying(false);
      }
    }, 500);
  }, [isPlaying]);

  const getResultEmoji = () => {
    if (result === 'win') return '🎉';
    if (result === 'lose') return '😢';
    return '🤝';
  };

  const getResultText = () => {
    if (result === 'win') return t({ en: 'You Win!', pt: 'You Win!' });
    if (result === 'lose') return t({ en: 'You Lose...', pt: 'You Lose...' });
    return t({ en: 'Draw', pt: 'Draw' });
  };

  const getResultColor = () => {
    if (result === 'win') return 'from-green-400 to-emerald-500';
    if (result === 'lose') return 'from-red-400 to-rose-500';
    return 'from-yellow-400 to-amber-500';
  };

  const resetStats = () => {
    setStats({ wins: 0, losses: 0, draws: 0 });
    setStreak(0);
    setMaxStreak(0);
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto">
      {/* Stats */}
      <div className="w-full grid grid-cols-4 gap-2 mb-8">
        <div className="bg-green-500/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-500">{stats.wins}</div>
          <div className="text-xs text-[var(--color-text-muted)]">{t({ en: 'Wins', pt: 'Wins' })}</div>
        </div>
        <div className="bg-red-500/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-500">{stats.losses}</div>
          <div className="text-xs text-[var(--color-text-muted)]">{t({ en: 'Losses', pt: 'Losses' })}</div>
        </div>
        <div className="bg-yellow-500/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-500">{stats.draws}</div>
          <div className="text-xs text-[var(--color-text-muted)]">{t({ en: 'Draws', pt: 'Draws' })}</div>
        </div>
        <div className="bg-purple-500/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-500">{streak}</div>
          <div className="text-xs text-[var(--color-text-muted)]">{t({ en: 'Streak', pt: 'Streak' })}</div>
        </div>
      </div>

      {/* Battle screen */}
      <div className="w-full flex items-center justify-between mb-8">
        {/* Player */}
        <div className="text-center flex-1">
          <div className="text-sm text-[var(--color-text-muted)] mb-2">{t({ en: 'You', pt: 'You' })}</div>
          <div
            className={`w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center text-5xl md:text-6xl border-4 border-blue-500 ${
              isPlaying && playerChoice ? 'animate-bounce' : ''
            }`}
          >
            {playerChoice
              ? CHOICES.find((c) => c.id === playerChoice)?.emoji
              : '❓'}
          </div>
        </div>

        {/* VS */}
        <div className="text-center px-4">
          {countdown !== null ? (
            <div className="text-5xl font-bold text-yellow-500 animate-ping">
              {countdown}
            </div>
          ) : result !== null ? (
            <div
              className={`px-4 py-2 rounded-full bg-gradient-to-r ${getResultColor()} text-white font-bold`}
            >
              {getResultText()}
            </div>
          ) : (
            <div className="text-3xl font-bold text-[var(--color-text-muted)]">{t({ en: 'VS', pt: 'VS' })}</div>
          )}
        </div>

        {/* Computer */}
        <div className="text-center flex-1">
          <div className="text-sm text-[var(--color-text-muted)] mb-2">{t({ en: 'Computer', pt: 'Computer' })}</div>
          <div
            className={`w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full bg-red-500/20 flex items-center justify-center text-5xl md:text-6xl border-4 border-red-500 ${
              isPlaying && !computerChoice ? 'animate-pulse' : ''
            }`}
          >
            {computerChoice
              ? CHOICES.find((c) => c.id === computerChoice)?.emoji
              : isPlaying
              ? '🤔'
              : '🤖'}
          </div>
        </div>
      </div>

      {/* Result message */}
      {result && (
        <div
          className={`mb-8 text-center p-4 rounded-xl bg-gradient-to-r ${getResultColor()} text-white animate-bounce`}
        >
          <div className="text-4xl mb-2">{getResultEmoji()}</div>
          <div className="text-xl font-bold">{getResultText()}</div>
          {streak >= 3 && result === 'win' && (
            <div className="text-sm mt-1">🔥 {t({ en: `${streak} win streak!`, pt: `${streak} win streak!` })}</div>
          )}
        </div>
      )}

      {/* Choice buttons */}
      <div className="w-full">
        <div className="text-center text-sm text-[var(--color-text-muted)] mb-4">
          {t({ en: 'Make your choice', pt: 'Make your choice' })}
        </div>
        <div className="flex justify-center gap-4">
          {CHOICES.map((choice) => (
            <button
              key={choice.id}
              onClick={() => play(choice.id)}
              disabled={isPlaying}
              className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[var(--color-card)] border-2 border-[var(--color-border)] hover:border-primary-500 text-4xl md:text-5xl transition-all transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                playerChoice === choice.id && !isPlaying
                  ? 'ring-4 ring-primary-500'
                  : ''
              }`}
            >
              {choice.emoji}
            </button>
          ))}
        </div>
        <div className="flex justify-center gap-4 mt-2 text-sm text-[var(--color-text-muted)]">
          {CHOICES.map((choice) => (
            <div key={choice.id} className="w-20 md:w-24 text-center">
              {getChoiceName(choice.id)}
            </div>
          ))}
        </div>
      </div>

      {/* Best streak & reset */}
      <div className="mt-8 flex items-center gap-4">
        <span className="text-sm text-[var(--color-text-muted)]">
          {t({ en: 'Best Streak', pt: 'Best Streak' })}: <span className="font-bold text-primary-500">{maxStreak}</span>
        </span>
        <button
          onClick={resetStats}
          className="text-sm px-3 py-1 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-card)] transition-colors"
        >
          {t({ en: 'Reset Stats', pt: 'Reset Stats' })}
        </button>
      </div>
    </div>
  );
}
