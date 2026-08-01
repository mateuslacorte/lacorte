'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslation } from '../i18n/useTranslation';

type GameState = 'ready' | 'waiting' | 'click' | 'result' | 'too-early';

export default function ReactionTest() {
  const { t } = useTranslation();
  const [state, setState] = useState<GameState>('ready');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [results, setResults] = useState<number[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = useCallback(() => {
    setState('waiting');

    // Random wait time (2-5 seconds)
    const waitTime = 2000 + Math.random() * 3000;

    // Approximate countdown
    let remaining = 3;
    setCountdown(remaining);
    const countdownInterval = setInterval(() => {
      remaining--;
      if (remaining > 0) {
        setCountdown(remaining);
      } else {
        clearInterval(countdownInterval);
        setCountdown(null);
      }
    }, 1000);

    timeoutRef.current = setTimeout(() => {
      clearInterval(countdownInterval);
      setCountdown(null);
      setState('click');
      startTimeRef.current = Date.now();
    }, waitTime);
  }, []);

  const handleClick = useCallback(() => {
    if (state === 'ready' || state === 'result' || state === 'too-early') {
      startGame();
    } else if (state === 'waiting') {
      // Clicked too early
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setState('too-early');
      setReactionTime(null);
    } else if (state === 'click') {
      const time = Date.now() - startTimeRef.current;
      setReactionTime(time);
      setResults((prev) => [...prev.slice(-9), time]);
      setState('result');
    }
  }, [state, startGame]);

  const getAverageTime = () => {
    if (results.length === 0) return null;
    return Math.round(results.reduce((a, b) => a + b, 0) / results.length);
  };

  const getBestTime = () => {
    if (results.length === 0) return null;
    return Math.min(...results);
  };

  const getRank = (time: number) => {
    if (time < 150) return { rank: 'S', label: t({ en: 'Godlike!', pt: 'Godlike!' }), color: 'text-yellow-400', emoji: '⚡' };
    if (time < 200) return { rank: 'A', label: t({ en: 'Very Fast', pt: 'Very Fast' }), color: 'text-green-400', emoji: '🚀' };
    if (time < 250) return { rank: 'B', label: t({ en: 'Fast', pt: 'Fast' }), color: 'text-blue-400', emoji: '💨' };
    if (time < 300) return { rank: 'C', label: t({ en: 'Average', pt: 'Average' }), color: 'text-purple-400', emoji: '👍' };
    if (time < 400) return { rank: 'D', label: t({ en: 'Slow', pt: 'Slow' }), color: 'text-orange-400', emoji: '🐢' };
    return { rank: 'F', label: t({ en: 'Very Slow', pt: 'Very Slow' }), color: 'text-red-400', emoji: '😴' };
  };

  const getBackgroundColor = () => {
    switch (state) {
      case 'waiting':
        return 'bg-red-500';
      case 'click':
        return 'bg-green-500';
      case 'too-early':
        return 'bg-orange-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getStateText = () => {
    switch (state) {
      case 'ready':
        return { main: t({ en: 'Click to Start', pt: 'Click to Start' }), sub: t({ en: 'Test your reaction speed', pt: 'Test your reaction speed' }) };
      case 'waiting':
        return {
          main: t({ en: 'Wait...', pt: 'Wait...' }),
          sub: countdown
            ? t({ en: `Ready ${countdown}`, pt: `Ready ${countdown}` })
            : t({ en: 'Click when it turns green!', pt: 'Click when it turns green!' }),
        };
      case 'click':
        return { main: t({ en: 'Now!', pt: 'Now!' }), sub: t({ en: 'Click!', pt: 'Click!' }) };
      case 'too-early':
        return { main: t({ en: 'Too Early!', pt: 'Too Early!' }), sub: t({ en: 'Wait until the screen turns green', pt: 'Wait until the screen turns green' }) };
      case 'result':
        return { main: `${reactionTime}ms`, sub: getRank(reactionTime!).label };
    }
  };

  const resetResults = () => {
    setResults([]);
    setReactionTime(null);
    setState('ready');
  };

  const stateText = getStateText();
  const rank = reactionTime ? getRank(reactionTime) : null;

  return (
    <div className="max-w-lg mx-auto">
      {/* Main click area */}
      <button
        onClick={handleClick}
        className={`w-full h-64 md:h-80 rounded-2xl flex flex-col items-center justify-center transition-colors duration-200 ${getBackgroundColor()} text-white shadow-xl hover:shadow-2xl`}
      >
        {state === 'result' && rank && (
          <div className="text-6xl mb-4 animate-bounce">{rank.emoji}</div>
        )}
        <div className="text-4xl md:text-5xl font-bold mb-2">{stateText.main}</div>
        <div className="text-lg opacity-90">{stateText.sub}</div>
        {state === 'result' && rank && (
          <div className={`mt-4 text-2xl font-bold ${rank.color}`}>
            {t({ en: 'Rank', pt: 'Rank' })}: {rank.rank}
          </div>
        )}
      </button>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-[var(--color-card)] rounded-xl p-4 text-center border border-[var(--color-border)]">
          <div className="text-2xl font-bold text-green-500">
            {getBestTime() ? `${getBestTime()}ms` : '-'}
          </div>
          <div className="text-sm text-[var(--color-text-muted)]">{t({ en: 'Best', pt: 'Best' })}</div>
        </div>
        <div className="bg-[var(--color-card)] rounded-xl p-4 text-center border border-[var(--color-border)]">
          <div className="text-2xl font-bold text-blue-500">
            {getAverageTime() ? `${getAverageTime()}ms` : '-'}
          </div>
          <div className="text-sm text-[var(--color-text-muted)]">{t({ en: 'Average', pt: 'Average' })}</div>
        </div>
        <div className="bg-[var(--color-card)] rounded-xl p-4 text-center border border-[var(--color-border)]">
          <div className="text-2xl font-bold text-purple-500">{results.length}</div>
          <div className="text-sm text-[var(--color-text-muted)]">{t({ en: 'Attempts', pt: 'Attempts' })}</div>
        </div>
      </div>

      {/* Recent results */}
      {results.length > 0 && (
        <div className="mt-6 bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">{t({ en: 'Recent Results', pt: 'Recent Results' })}</h3>
            <button
              onClick={resetResults}
              className="text-sm text-red-500 hover:text-red-400"
            >
              {t({ en: 'Reset', pt: 'Reset' })}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {results.map((time, index) => {
              const timeRank = getRank(time);
              return (
                <div
                  key={index}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    time === getBestTime()
                      ? 'bg-yellow-500/20 border border-yellow-500'
                      : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span className={timeRank.color}>{time}ms</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rank guide */}
      <div className="mt-6 bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)]">
        <h3 className="font-bold mb-4 text-center">{t({ en: 'Rank Guide', pt: 'Rank Guide' })}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {[
            { range: '< 150ms', rank: 'S', color: 'text-yellow-400' },
            { range: '< 200ms', rank: 'A', color: 'text-green-400' },
            { range: '< 250ms', rank: 'B', color: 'text-blue-400' },
            { range: '< 300ms', rank: 'C', color: 'text-purple-400' },
            { range: '< 400ms', rank: 'D', color: 'text-orange-400' },
            { range: '400ms+', rank: 'F', color: 'text-red-400' },
          ].map(({ range, rank, color }) => (
            <div
              key={rank}
              className="flex items-center justify-between p-2 bg-[var(--color-border)] rounded"
            >
              <span className="text-[var(--color-text-muted)]">{range}</span>
              <span className={`font-bold ${color}`}>{rank}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tip */}
      <div className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div className="text-sm text-[var(--color-text-muted)]">
            <p className="font-bold mb-1">{t({ en: 'Tip', pt: 'Tip' })}</p>
            <p>{t({ en: 'The average human reaction time is about 200-250ms. Keep practicing and you can improve your speed!', pt: 'The average human reaction time is about 200-250ms. Keep practicing and you can improve your speed!' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
