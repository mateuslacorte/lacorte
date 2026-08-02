'use client';

import { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

export default function CoinFlip({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tc = translations.tools.coinFlip;

  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [history, setHistory] = useState<Array<'heads' | 'tails'>>([]);
  const [stats, setStats] = useState({ heads: 0, tails: 0 });

  const flip = () => {
    if (isFlipping) return;

    setIsFlipping(true);
    setResult(null);

    // Animation duration
    setTimeout(() => {
      const outcome: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
      setResult(outcome);
      setHistory((prev) => [outcome, ...prev].slice(0, 20));
      setStats((prev) => ({
        ...prev,
        [outcome]: prev[outcome] + 1,
      }));
      setIsFlipping(false);
    }, 1000);
  };

  const reset = () => {
    setResult(null);
    setHistory([]);
    setStats({ heads: 0, tails: 0 });
  };

  const total = stats.heads + stats.tails;
  const headsPercent = total > 0 ? (stats.heads / total) * 100 : 50;

  return (
    <div className="flex flex-col gap-6">
      {/* Coin Display */}
      <div className="flex flex-col items-center gap-4">
        <div
          className={`w-48 h-48 rounded-full flex items-center justify-center text-7xl
            border-8 transition-all duration-300 ${
              isFlipping
                ? 'animate-spin border-[var(--color-border)] bg-[var(--color-card)]'
                : result === 'heads'
                ? 'border-yellow-500 bg-yellow-500/10'
                : result === 'tails'
                ? 'border-gray-500 bg-gray-500/10'
                : 'border-[var(--color-border)] bg-[var(--color-card)]'
            }`}
        >
          {isFlipping ? '🪙' : result === 'heads' ? '👑' : result === 'tails' ? '🦅' : '🪙'}
        </div>

        {result && !isFlipping && (
          <p className="text-3xl font-bold text-[var(--color-text)]">
            {result === 'heads' ? t(tc.headsResult) : t(tc.tailsResult)}
          </p>
        )}
      </div>

      {/* Flip Button */}
      <button
        onClick={flip}
        disabled={isFlipping}
        className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl
          font-bold text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isFlipping ? t(tc.flipping) : t(tc.flipButton)}
      </button>

      {/* Statistics */}
      {total > 0 && (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-[var(--color-text-muted)]">
              <span>👑 {t(tc.headsLabel)}: {stats.heads} ({headsPercent.toFixed(1)}%)</span>
              <span>🦅 {t(tc.tailsLabel)}: {stats.tails} ({(100 - headsPercent).toFixed(1)}%)</span>
            </div>
            <div className="h-4 rounded-full overflow-hidden bg-gray-500/20">
              <div
                className="h-full bg-yellow-500 transition-all duration-300"
                style={{ width: `${headsPercent}%` }}
              />
            </div>
          </div>

          {/* History */}
          <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-[var(--color-text)]">{t(tc.historyTitle)}</h3>
              <button
                onClick={reset}
                className="text-sm text-red-500 hover:underline"
              >
                {t(translations.tools.common.reset)}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.map((h, i) => (
                <span
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                    ${h === 'heads' ? 'bg-yellow-500/20' : 'bg-gray-500/20'}`}
                >
                  {h === 'heads' ? '👑' : '🦅'}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <h3 className="font-medium text-[var(--color-text)] mb-2">{t(tc.tipsTitle)}</h3>
        <ul className="text-sm text-[var(--color-text-muted)] space-y-1">
          <li>• {t(tc.tip1)}</li>
          <li>• {t(tc.tip2)}</li>
          <li>• {t(tc.tip3)}</li>
        </ul>
      </div>
    </div>
  );
}
