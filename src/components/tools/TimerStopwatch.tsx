'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

type Mode = 'timer' | 'stopwatch';

function formatTime(ms: number, showMs: boolean = false): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((ms % 1000) / 10);

  const parts = [];
  if (hours > 0) parts.push(hours.toString().padStart(2, '0'));
  parts.push(minutes.toString().padStart(2, '0'));
  parts.push(seconds.toString().padStart(2, '0'));

  let result = parts.join(':');
  if (showMs) {
    result += '.' + milliseconds.toString().padStart(2, '0');
  }
  return result;
}

export default function TimerStopwatch({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tt = translations.tools.timer;
  const tc = translations.tools.common;

  const [mode, setMode] = useState<Mode>('stopwatch');
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const [timerInput, setTimerInput] = useState({ hours: 0, minutes: 5, seconds: 0 });
  const [timeUp, setTimeUp] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (mode === 'timer' && time === 0) {
      const totalMs = (timerInput.hours * 3600 + timerInput.minutes * 60 + timerInput.seconds) * 1000;
      if (totalMs === 0) return;
      setTime(totalMs);
      elapsedRef.current = totalMs;
    }

    startTimeRef.current = Date.now();
    setIsRunning(true);
    setTimeUp(false);

    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;

      if (mode === 'stopwatch') {
        setTime(elapsedRef.current + elapsed);
      } else {
        const remaining = elapsedRef.current - elapsed;
        if (remaining <= 0) {
          setTime(0);
          setIsRunning(false);
          setTimeUp(true);
          clearTimer();
          // Play sound or notification
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
        } else {
          setTime(remaining);
        }
      }
    }, 10);
  }, [mode, time, timerInput, clearTimer]);

  const pause = useCallback(() => {
    setIsRunning(false);
    clearTimer();
    elapsedRef.current = time;
  }, [time, clearTimer]);

  const reset = useCallback(() => {
    setIsRunning(false);
    clearTimer();
    setTime(0);
    elapsedRef.current = 0;
    setLaps([]);
    setTimeUp(false);
  }, [clearTimer]);

  const lap = useCallback(() => {
    if (mode === 'stopwatch' && isRunning) {
      setLaps((prev) => [...prev, time]);
    }
  }, [mode, isRunning, time]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const handleModeChange = (newMode: Mode) => {
    reset();
    setMode(newMode);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Mode Toggle */}
      <div className="flex rounded-lg overflow-hidden border border-[var(--color-border)]">
        <button
          onClick={() => handleModeChange('stopwatch')}
          className={`flex-1 py-3 font-medium transition-colors
            ${mode === 'stopwatch'
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--color-card)] text-[var(--color-text)] hover:bg-[var(--color-card-hover)]'
            }`}
        >
          {t(tt.stopwatchTab)}
        </button>
        <button
          onClick={() => handleModeChange('timer')}
          className={`flex-1 py-3 font-medium transition-colors
            ${mode === 'timer'
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--color-card)] text-[var(--color-text)] hover:bg-[var(--color-card-hover)]'
            }`}
        >
          {t(tt.timerTab)}
        </button>
      </div>

      {/* Timer Input (only for timer mode when not running) */}
      {mode === 'timer' && !isRunning && time === 0 && (
        <div className="flex justify-center gap-4">
          {[
            { key: 'hours', label: tt.hours, max: 23 },
            { key: 'minutes', label: tt.minutes, max: 59 },
            { key: 'seconds', label: tt.seconds, max: 59 },
          ].map(({ key, label, max }) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <input
                type="number"
                min="0"
                max={max}
                value={timerInput[key as keyof typeof timerInput]}
                onChange={(e) => setTimerInput({
                  ...timerInput,
                  [key]: Math.max(0, Math.min(max, Number(e.target.value)))
                })}
                className="w-20 px-3 py-2 text-center text-2xl font-mono rounded-lg
                  border border-[var(--color-border)] bg-[var(--color-card)]
                  text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm text-[var(--color-text-muted)]">{t(label)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Time Display */}
      <div className={`text-center py-8 ${timeUp ? 'animate-pulse' : ''}`}>
        <div className={`font-mono font-bold ${timeUp ? 'text-red-500' : 'text-[var(--color-text)]'}`}
          style={{ fontSize: 'clamp(3rem, 15vw, 6rem)' }}>
          {formatTime(time, mode === 'stopwatch')}
        </div>
        {timeUp && (
          <p className="text-xl text-red-500 font-medium mt-2 animate-bounce">
            {t(tt.timeUp)}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {!isRunning ? (
          <button
            onClick={start}
            className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full
              font-medium transition-colors text-lg"
          >
            {t(tc.start)}
          </button>
        ) : (
          <button
            onClick={pause}
            className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full
              font-medium transition-colors text-lg"
          >
            {t(tc.pause)}
          </button>
        )}

        {mode === 'stopwatch' && isRunning && (
          <button
            onClick={lap}
            className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full
              font-medium transition-colors text-lg"
          >
            {t(tt.lap)}
          </button>
        )}

        <button
          onClick={reset}
          className="px-8 py-3 bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
            border border-[var(--color-border)] rounded-full font-medium transition-colors text-lg"
        >
          {t(tc.reset)}
        </button>
      </div>

      {/* Laps (stopwatch mode) */}
      {mode === 'stopwatch' && laps.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-[var(--color-text-muted)]">
            {t(tt.lap)} ({laps.length})
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {laps.map((lapTime, index) => {
              const lapDiff = index === 0 ? lapTime : lapTime - laps[index - 1];
              return (
                <div
                  key={index}
                  className="flex justify-between items-center px-4 py-2 rounded-lg
                    bg-[var(--color-card)] border border-[var(--color-border)]"
                >
                  <span className="text-[var(--color-text-muted)]">#{index + 1}</span>
                  <span className="font-mono text-[var(--color-text)]">
                    +{formatTime(lapDiff, true)}
                  </span>
                  <span className="font-mono font-medium text-[var(--color-text)]">
                    {formatTime(lapTime, true)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
