'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslation } from '../i18n/useTranslation';

interface RouletteItem {
  id: string;
  text: string;
  color: string;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
];

export default function Roulette() {
  const { t } = useTranslation();
  const [items, setItems] = useState<RouletteItem[]>([
    { id: '1', text: 'Item 1', color: COLORS[0] },
    { id: '2', text: 'Item 2', color: COLORS[1] },
    { id: '3', text: 'Item 3', color: COLORS[2] },
    { id: '4', text: 'Item 4', color: COLORS[3] },
  ]);
  const [newItem, setNewItem] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const addItem = () => {
    if (newItem.trim() && items.length < 12) {
      const newId = Date.now().toString();
      setItems([
        ...items,
        {
          id: newId,
          text: newItem.trim(),
          color: COLORS[items.length % COLORS.length],
        },
      ]);
      setNewItem('');
    }
  };

  const removeItem = (id: string) => {
    if (items.length > 2) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const spin = useCallback(() => {
    if (isSpinning || items.length < 2) return;

    setIsSpinning(true);
    setWinner(null);

    const spins = 5 + Math.random() * 5;
    const extraDegrees = Math.random() * 360;
    const totalRotation = rotation + spins * 360 + extraDegrees;

    setRotation(totalRotation);

    setTimeout(() => {
      const normalizedRotation = totalRotation % 360;
      const segmentAngle = 360 / items.length;
      const pointerOffset = 90;
      const adjustedRotation = (360 - normalizedRotation + pointerOffset) % 360;
      const winningIndex = Math.floor(adjustedRotation / segmentAngle) % items.length;

      setWinner(items[winningIndex].text);
      setIsSpinning(false);
    }, 4000);
  }, [isSpinning, items, rotation]);

  const reset = () => {
    setWinner(null);
    setRotation(0);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Wheel */}
      <div className="flex-1 flex flex-col items-center">
        <div className="relative">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
            <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-red-500 drop-shadow-lg" />
          </div>

          {/* Wheel */}
          <div
            ref={wheelRef}
            className="w-72 h-72 md:w-96 md:h-96 rounded-full relative overflow-hidden shadow-2xl"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
            }}
          >
            {items.map((item, index) => {
              const segmentAngle = 360 / items.length;
              const startAngle = index * segmentAngle;

              return (
                <div
                  key={item.id}
                  className="absolute w-full h-full"
                  style={{
                    background: `conic-gradient(from ${startAngle}deg, ${item.color} 0deg, ${item.color} ${segmentAngle}deg, transparent ${segmentAngle}deg)`,
                  }}
                >
                  <div
                    className="absolute top-1/2 left-1/2 origin-left text-white font-bold text-sm md:text-base whitespace-nowrap"
                    style={{
                      transform: `rotate(${startAngle + segmentAngle / 2}deg) translateX(30%)`,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                    }}
                  >
                    {item.text}
                  </div>
                </div>
              );
            })}
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>

        {/* Spin Button */}
        <button
          onClick={spin}
          disabled={isSpinning || items.length < 2}
          className="mt-8 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSpinning ? t({ en: 'Spinning...', pt: 'Spinning...' }) : t({ en: '🎲 Spin!', pt: '🎲 Spin!' })}
        </button>

        {/* Winner */}
        {winner && (
          <div className="mt-6 p-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl text-white text-center animate-bounce">
            <div className="text-2xl mb-2">{t({ en: '🎉 Winner!', pt: '🎉 Winner!' })}</div>
            <div className="text-3xl font-bold">{winner}</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full lg:w-80 space-y-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
          <h3 className="font-bold mb-4">{t({ en: 'Manage Items', pt: 'Manage Items' })}</h3>

          {/* Add Item */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
              placeholder={t({ en: 'Enter new item', pt: 'Enter new item' })}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={items.length >= 12}
            />
            <button
              onClick={addItem}
              disabled={!newItem.trim() || items.length >= 12}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t({ en: 'Add', pt: 'Add' })}
            </button>
          </div>

          {/* Items List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded-lg"
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="flex-1 truncate">{item.text}</span>
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={items.length <= 2}
                  className="text-red-500 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500 mt-2">
            {t({ en: `${items.length}/12 items (minimum 2 required)`, pt: `${items.length}/12 items (minimum 2 required)` })}
          </p>
        </div>

        {/* Reset Button */}
        <button
          onClick={reset}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {t({ en: 'Reset', pt: 'Reset' })}
        </button>
      </div>
    </div>
  );
}
