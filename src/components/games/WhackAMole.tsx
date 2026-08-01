'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

const GRID_SIZE = 9;
const GAME_DURATION = 30;

export default function WhackAMole() {
  const { t } = useTranslation();
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPlaying, setIsPlaying] = useState(false);
  const [moleIndex, setMoleIndex] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('whack-a-mole-best');
    if (saved) {
      setBestScore(parseInt(saved, 10));
    }
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsPlaying(false);
          setMoleIndex(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;

    const moveMole = () => {
      setMoleIndex(Math.floor(Math.random() * GRID_SIZE));
    };

    moveMole();
    const moleTimer = setInterval(moveMole, 650);

    return () => clearInterval(moleTimer);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying && timeLeft === 0 && score > bestScore) {
      setBestScore(score);
      localStorage.setItem('whack-a-mole-best', score.toString());
    }
  }, [isPlaying, timeLeft, score, bestScore]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setIsPlaying(true);
  };

  const hitMole = (index: number) => {
    if (!isPlaying) return;

    setMoleIndex(prevIndex => {
      if (prevIndex !== index) {
        return prevIndex;
      }

      setScore(prev => prev + 1);
      return Math.floor(Math.random() * GRID_SIZE);
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="grid grid-cols-3 gap-3 mb-6 text-center">
        <div className="p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-muted)]">{t({ en: 'Score', pt: 'Score' })}</p>
          <p className="text-2xl font-bold text-primary-500">{score}</p>
        </div>
        <div className="p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-muted)]">{t({ en: 'Time', pt: 'Time' })}</p>
          <p className="text-2xl font-bold text-orange-500">{timeLeft}</p>
        </div>
        <div className="p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-muted)]">{t({ en: 'Best', pt: 'Best' })}</p>
          <p className="text-2xl font-bold text-green-500">{bestScore}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {Array.from({ length: GRID_SIZE }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => hitMole(index)}
            className="h-20 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:border-primary-500 transition-colors"
            aria-label={t({ en: `Hole ${index + 1}`, pt: `Hole ${index + 1}` })}
          >
            <span className="text-3xl">{moleIndex === index ? '🐹' : '🕳️'}</span>
          </button>
        ))}
      </div>

      <div className="text-center">
        {!isPlaying && timeLeft > 0 && (
          <p className="text-[var(--color-text-muted)] mb-4">
            {t({ en: `Catch as many moles as you can in ${GAME_DURATION} seconds!`, pt: `Catch as many moles as you can in ${GAME_DURATION} seconds!` })}
          </p>
        )}

        {!isPlaying && timeLeft === 0 && (
          <p className="text-lg font-bold mb-4">
            {t({ en: 'Time Up!', pt: 'Time Up!' })} {t({ en: 'Final Score', pt: 'Final Score' })}: {score}
          </p>
        )}

        <button
          type="button"
          onClick={startGame}
          className="px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-colors"
        >
          {isPlaying
            ? t({ en: 'Restart', pt: 'Restart' })
            : t({ en: 'Start Game', pt: 'Start Game' })}
        </button>
      </div>
    </div>
  );
}
