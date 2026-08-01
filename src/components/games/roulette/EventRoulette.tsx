'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslation } from '../../../i18n/useTranslation';
import RouletteWheel, { type RouletteItem, type RouletteWheelHandle } from './RouletteWheel';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
  '#FF9F43', '#EE5A24', '#0984E3', '#6C5CE7',
];

interface Winner {
  text: string;
  timestamp: Date;
}

export default function EventRoulette() {
  const { t } = useTranslation();
  const wheelRef = useRef<RouletteWheelHandle>(null);
  const [items, setItems] = useState<RouletteItem[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [bulkInput, setBulkInput] = useState('');
  const [excludeWinners, setExcludeWinners] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Parse bulk input
  const handleBulkInput = () => {
    const names = bulkInput
      .split(/[\n,]/)
      .map(name => name.trim())
      .filter(name => name.length > 0);

    // Remove duplicates
    const uniqueNames = [...new Set(names)];

    const newItems: RouletteItem[] = uniqueNames.map((name, idx) => ({
      id: `${Date.now()}-${idx}`,
      text: name,
      color: COLORS[idx % COLORS.length],
    }));

    setItems(newItems);
    setWinner(null);
    setWinners([]);
  };

  // Clear all
  const clearAll = () => {
    setBulkInput('');
    setItems([]);
    setWinner(null);
    setWinners([]);
  };

  // Handle spin end
  const handleSpinEnd = useCallback((winnerItem: RouletteItem) => {
    setWinner(winnerItem.text);
    setWinners(prev => [...prev, { text: winnerItem.text, timestamp: new Date() }]);

    // Remove winner if excludeWinners is enabled
    if (excludeWinners) {
      setItems(prev => prev.filter(item => item.id !== winnerItem.id));
    }
  }, [excludeWinners]);

  // Reset winners
  const resetWinners = () => {
    // Restore all items from bulk input
    handleBulkInput();
    setWinners([]);
    setWinner(null);
  };

  // Available items count
  const availableCount = items.length;

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-[var(--color-bg)] p-4 overflow-auto' : ''}`}>
      <div className={`flex flex-col lg:flex-row gap-6 w-full ${isFullscreen ? '' : 'max-w-6xl mx-auto px-4'}`}>
        {/* Wheel Section */}
        <div className="flex-1 flex flex-col items-center">
          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="self-end mb-2 px-3 py-1 text-sm bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card-hover)]"
          >
            {isFullscreen
              ? t({ en: 'Exit Fullscreen', pt: 'Exit Fullscreen' })
              : t({ en: 'Fullscreen', pt: 'Fullscreen' })}
          </button>

          {items.length >= 2 ? (
            <>
              <RouletteWheel
                ref={wheelRef}
                items={items}
                isSpinning={isSpinning}
                setIsSpinning={setIsSpinning}
                onSpinEnd={handleSpinEnd}
                size={isFullscreen ? 500 : 320}
              />

              {/* Spin Button */}
              <button
                onClick={() => {
                  if (!isSpinning && items.length >= 2) {
                    setWinner(null);
                    wheelRef.current?.spin();
                  }
                }}
                disabled={isSpinning || items.length < 2}
                className="mt-6 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSpinning
                  ? t({ en: 'Drawing...', pt: 'Drawing...' })
                  : t({ en: '🎲 Draw!', pt: '🎲 Draw!' })}
              </button>

              {/* Participant count */}
              <p className="mt-4 text-[var(--color-text-muted)]">
                {t({ en: 'Remaining', pt: 'Remaining' })}: <span className="font-bold text-primary-500">{availableCount}</span>
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 text-[var(--color-text-muted)]">
              <div className="text-6xl mb-4">🎡</div>
              <p>{t({ en: 'Add participants', pt: 'Add participants' })}</p>
              <p className="text-sm">{t({ en: '(minimum 2)', pt: '(minimum 2)' })}</p>
            </div>
          )}

          {/* Winner Display */}
          {winner && (
            <div className="mt-6 p-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl text-white text-center animate-bounce">
              <div className="text-2xl mb-2">🎉 {t({ en: 'Winner!', pt: 'Winner!' })}</div>
              <div className="text-4xl font-bold">{winner}</div>
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className={`w-full ${isFullscreen ? 'lg:w-96' : 'lg:w-80'} space-y-4`}>
          {/* Bulk Input */}
          <div className="bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)]">
            <h3 className="font-bold mb-3">
              {t({ en: 'Add Participants', pt: 'Add Participants' })}
            </h3>
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder={t({ en: 'Enter names\n(separated by newlines or commas)\n\nExample:\nJohn\nJane, Bob\nAlice', pt: 'Enter names\n(separated by newlines or commas)\n\nExample:\nJohn\nJane, Bob\nAlice' })}
              className="w-full h-40 p-3 text-sm border border-[var(--color-border)] rounded-lg resize-none bg-[var(--color-bg)]"
            />

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleBulkInput}
                disabled={!bulkInput.trim()}
                className="flex-1 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {t({ en: 'Apply', pt: 'Apply' })}
              </button>
              <button
                onClick={clearAll}
                className="px-4 py-2 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card-hover)]"
              >
                {t({ en: 'Clear', pt: 'Clear' })}
              </button>
            </div>

            {/* Stats */}
            {bulkInput && (
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {t({ en: 'Names entered', pt: 'Names entered' })}: {
                  [...new Set(bulkInput.split(/[\n,]/).map(n => n.trim()).filter(n => n))].length
                }
              </p>
            )}
          </div>

          {/* Options */}
          <div className="bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)]">
            <h3 className="font-bold mb-3">
              {t({ en: 'Options', pt: 'Options' })}
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={excludeWinners}
                onChange={(e) => setExcludeWinners(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">
                {t({ en: 'Auto-exclude winners', pt: 'Auto-exclude winners' })}
              </span>
            </label>
          </div>

          {/* Winner History */}
          {winners.length > 0 && (
            <div className="bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold">
                  {t({ en: 'Winner History', pt: 'Winner History' })} ({winners.length})
                </h3>
                <button
                  onClick={resetWinners}
                  className="text-sm text-primary-500 hover:underline"
                >
                  {t({ en: 'Reset', pt: 'Reset' })}
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {winners.map((w, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-[var(--color-bg)] rounded-lg"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 flex items-center justify-center bg-yellow-500 text-white text-xs font-bold rounded-full">
                        {idx + 1}
                      </span>
                      <span className="font-medium">{w.text}</span>
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {w.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Participants */}
          {items.length > 0 && (
            <div className="bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)]">
              <h3 className="font-bold mb-3">
                {t({ en: 'Participants', pt: 'Participants' })} ({items.length})
              </h3>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {items.map(item => (
                  <span
                    key={item.id}
                    className="px-2 py-1 text-xs text-white rounded-full"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.text}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
