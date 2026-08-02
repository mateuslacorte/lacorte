'use client';

import { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

interface DiceConfig {
  sides: number;
  count: number;
}

export default function DiceRoller({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tc = translations.tools.dice;

  const [config, setConfig] = useState<DiceConfig>({ sides: 6, count: 1 });
  const [results, setResults] = useState<number[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState<Array<{ config: DiceConfig; results: number[]; total: number }>>([]);

  const diceTypes = [4, 6, 8, 10, 12, 20, 100];

  const roll = () => {
    if (isRolling) return;

    setIsRolling(true);
    setResults([]);

    setTimeout(() => {
      const newResults = Array.from({ length: config.count }, () =>
        Math.floor(Math.random() * config.sides) + 1
      );
      setResults(newResults);
      setHistory((prev) => [
        { config: { ...config }, results: newResults, total: newResults.reduce((a, b) => a + b, 0) },
        ...prev,
      ].slice(0, 10));
      setIsRolling(false);
    }, 800);
  };

  const total = results.reduce((a, b) => a + b, 0);
  const maxPossible = config.sides * config.count;
  const minPossible = config.count;

  const getDiceEmoji = (sides: number) => {
    const emojis: Record<number, string> = {
      4: '🔺',
      6: '🎲',
      8: '💎',
      10: '🔟',
      12: '⬡',
      20: '🎯',
      100: '💯',
    };
    return emojis[sides] || '🎲';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Dice Type Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {t(tc.diceType)}
        </label>
        <div className="flex flex-wrap gap-2">
          {diceTypes.map((sides) => (
            <button
              key={sides}
              onClick={() => setConfig((c) => ({ ...c, sides }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${config.sides === sides
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] text-[var(--color-text)] border border-[var(--color-border)]'
                }`}
            >
              {getDiceEmoji(sides)} D{sides}
            </button>
          ))}
        </div>
      </div>

      {/* Dice Count */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {t(tc.numberOfDice)}: {config.count}
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={config.count}
          onChange={(e) => setConfig((c) => ({ ...c, count: parseInt(e.target.value) }))}
          className="w-full accent-primary-500"
        />
        <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
          <span>1</span>
          <span>10</span>
        </div>
      </div>

      {/* Dice Display */}
      <div className="flex flex-wrap justify-center gap-4 min-h-[100px] items-center">
        {isRolling ? (
          <div className="text-6xl animate-bounce">{getDiceEmoji(config.sides)}</div>
        ) : results.length > 0 ? (
          results.map((result, i) => (
            <div
              key={i}
              className="w-16 h-16 rounded-lg bg-primary-500/10 border-2 border-primary-500
                flex items-center justify-center text-2xl font-bold text-primary-500"
            >
              {result}
            </div>
          ))
        ) : (
          <p className="text-[var(--color-text-muted)]">{t(tc.rollPrompt)}</p>
        )}
      </div>

      {/* Total */}
      {results.length > 0 && !isRolling && (
        <div className="text-center p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-text-muted)]">{t(tc.total)}</p>
          <p className="text-4xl font-bold text-primary-500">{total}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            ({t(tc.rangeLabel)}: {minPossible} ~ {maxPossible})
          </p>
        </div>
      )}

      {/* Roll Button */}
      <button
        onClick={roll}
        disabled={isRolling}
        className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl
          font-bold text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRolling ? t(tc.rolling) : `🎲 ${t(tc.rollButtonPrefix)} ${config.count}D${config.sides}`}
      </button>

      {/* Preset Rolls */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: '1D6', sides: 6, count: 1 },
          { label: '2D6', sides: 6, count: 2 },
          { label: '1D20', sides: 20, count: 1 },
          { label: '3D6', sides: 6, count: 3 },
          { label: '1D100', sides: 100, count: 1 },
          { label: '4D6', sides: 6, count: 4 },
        ].map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              setConfig({ sides: preset.sides, count: preset.count });
            }}
            className="px-3 py-1 text-sm rounded-lg bg-[var(--color-bg)]
              hover:bg-[var(--color-card-hover)] text-[var(--color-text-muted)]
              border border-[var(--color-border)] transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
          <h3 className="font-medium text-[var(--color-text)] mb-3">{t(tc.historyTitle)}</h3>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-bg)]"
              >
                <span className="text-sm text-[var(--color-text-muted)]">
                  {h.config.count}D{h.config.sides}
                </span>
                <span className="text-sm text-[var(--color-text)]">
                  [{h.results.join(', ')}]
                </span>
                <span className="font-bold text-primary-500">= {h.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
