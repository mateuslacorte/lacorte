'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from '../i18n/useTranslation';

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];
const WINNING_COMBOS: Record<string, { multiplier: number; name: string }> = {
  '7️⃣7️⃣7️⃣': { multiplier: 100, name: 'Jackpot!' },
  '💎💎💎': { multiplier: 50, name: 'Diamond!' },
  '⭐⭐⭐': { multiplier: 25, name: 'Star!' },
  '🍇🍇🍇': { multiplier: 15, name: 'Grapes!' },
  '🍊🍊🍊': { multiplier: 10, name: 'Orange!' },
  '🍋🍋🍋': { multiplier: 8, name: 'Lemon!' },
  '🍒🍒🍒': { multiplier: 5, name: 'Cherry!' },
};

export default function SlotMachine() {
  const { t } = useTranslation();
  const [reels, setReels] = useState(['🍒', '🍋', '🍊']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [coins, setCoins] = useState(100);
  const [bet, setBet] = useState(10);
  const [result, setResult] = useState<{ message: string; win: number } | null>(null);
  const [spinningReels, setSpinningReels] = useState([false, false, false]);

  const getRandomSymbol = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

  const translateComboName = (name: string) => t({ en: name });

  const spin = useCallback(() => {
    if (isSpinning || coins < bet) return;

    setCoins((prev) => prev - bet);
    setIsSpinning(true);
    setResult(null);
    setSpinningReels([true, true, true]);

    const newReels = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];

    // Stop reels one at a time
    setTimeout(() => {
      setReels((prev) => [newReels[0], prev[1], prev[2]]);
      setSpinningReels([false, true, true]);
    }, 1000);

    setTimeout(() => {
      setReels((prev) => [prev[0], newReels[1], prev[2]]);
      setSpinningReels([false, false, true]);
    }, 1500);

    setTimeout(() => {
      setReels(newReels);
      setSpinningReels([false, false, false]);
      setIsSpinning(false);

      // Check result
      const combo = newReels.join('');
      const winCombo = WINNING_COMBOS[combo];

      if (winCombo) {
        const winAmount = bet * winCombo.multiplier;
        setCoins((prev) => prev + winAmount);
        setResult({ message: translateComboName(winCombo.name), win: winAmount });
      } else if (newReels[0] === newReels[1] || newReels[1] === newReels[2]) {
        const smallWin = Math.floor(bet * 1.5);
        setCoins((prev) => prev + smallWin);
        setResult({ message: t({ en: '2 Match!', pt: '2 Match!' }), win: smallWin });
      } else {
        setResult({ message: t({ en: 'Try Again!', pt: 'Try Again!' }), win: 0 });
      }
    }, 2000);
  }, [isSpinning, coins, bet, t]);

  const addCoins = () => {
    setCoins((prev) => prev + 50);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Slot machine body */}
      <div className="bg-gradient-to-b from-red-600 to-red-800 rounded-3xl p-8 shadow-2xl border-4 border-yellow-400">
        {/* Top decoration */}
        <div className="text-center mb-4">
          <span className="text-4xl font-bold text-yellow-300 drop-shadow-lg">{t({ en: '🎰 SLOTS 🎰', pt: '🎰 SLOTS 🎰' })}</span>
        </div>

        {/* Reel display */}
        <div className="bg-black rounded-xl p-4 mb-6">
          <div className="flex gap-2 justify-center">
            {reels.map((symbol, index) => (
              <div
                key={index}
                className="w-20 h-24 md:w-28 md:h-32 bg-white rounded-lg flex items-center justify-center text-5xl md:text-6xl shadow-inner border-2 border-gray-300"
              >
                <span
                  className={`transform transition-transform ${
                    spinningReels[index] ? 'animate-spin-slow blur-sm' : ''
                  }`}
                >
                  {symbol}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Result display */}
        {result && (
          <div
            className={`text-center p-3 rounded-lg mb-4 ${
              result.win > 0
                ? 'bg-yellow-400 text-black animate-pulse'
                : 'bg-gray-700 text-white'
            }`}
          >
            <div className="text-xl font-bold">{result.message}</div>
            {result.win > 0 && (
              <div className="text-lg">{t({ en: `+${result.win} coins!`, pt: `+${result.win} coins!` })}</div>
            )}
          </div>
        )}

        {/* Coins and bet info */}
        <div className="flex justify-between items-center mb-4 text-white">
          <div className="text-center">
            <div className="text-sm opacity-75">{t({ en: 'Coins', pt: 'Coins' })}</div>
            <div className="text-2xl font-bold text-yellow-300">💰 {coins}</div>
          </div>
          <div className="text-center">
            <div className="text-sm opacity-75">{t({ en: 'Bet', pt: 'Bet' })}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBet(Math.max(5, bet - 5))}
                disabled={isSpinning || bet <= 5}
                className="w-8 h-8 bg-yellow-500 rounded-full font-bold hover:bg-yellow-400 disabled:opacity-50"
              >
                -
              </button>
              <span className="text-2xl font-bold w-12 text-center">{bet}</span>
              <button
                onClick={() => setBet(Math.min(coins, bet + 5))}
                disabled={isSpinning || bet >= coins}
                className="w-8 h-8 bg-yellow-500 rounded-full font-bold hover:bg-yellow-400 disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Spin button */}
        <button
          onClick={spin}
          disabled={isSpinning || coins < bet}
          className="w-full py-4 bg-gradient-to-b from-green-400 to-green-600 text-white text-2xl font-bold rounded-xl shadow-lg hover:from-green-300 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 transition-all"
        >
          {isSpinning ? t({ en: 'Spinning...', pt: 'Spinning...' }) : t({ en: '🎲 SPIN!', pt: '🎲 SPIN!' })}
        </button>

        {/* Free coins button */}
        {coins < 10 && (
          <button
            onClick={addCoins}
            className="w-full mt-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400"
          >
            {t({ en: '+50 Free Coins', pt: '+50 Free Coins' })}
          </button>
        )}
      </div>

      {/* Paytable */}
      <div className="mt-8 bg-[var(--color-card)] rounded-xl p-6 border border-[var(--color-border)] w-full max-w-md">
        <h3 className="font-bold text-lg mb-4 text-center">{t({ en: '💎 Paytable', pt: '💎 Paytable' })}</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(WINNING_COMBOS)
            .sort((a, b) => b[1].multiplier - a[1].multiplier)
            .map(([combo, { multiplier, name }]) => (
              <div
                key={combo}
                className="flex items-center justify-between p-2 bg-[var(--color-border)] rounded"
              >
                <span>{combo}</span>
                <span className="font-bold text-yellow-500">x{multiplier}</span>
              </div>
            ))}
          <div className="flex items-center justify-between p-2 bg-[var(--color-border)] rounded col-span-2">
            <span>{t({ en: '2 Match', pt: '2 Match' })}</span>
            <span className="font-bold text-yellow-500">x1.5</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotateX(0deg); }
          to { transform: rotateX(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 0.1s linear infinite;
        }
      `}</style>
    </div>
  );
}
