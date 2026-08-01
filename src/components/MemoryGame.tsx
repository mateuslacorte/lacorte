'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../i18n/useTranslation';

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJIS = ['🐶', '🐱', '🐼', '🦊', '🦁', '🐸', '🐵', '🐰', '🐻', '🐨', '🐯', '🦄'];

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const createCards = (pairCount: number): Card[] => {
  const selectedEmojis = EMOJIS.slice(0, pairCount);
  const pairs = [...selectedEmojis, ...selectedEmojis];
  const shuffled = shuffleArray(pairs);

  return shuffled.map((emoji, index) => ({
    id: index,
    emoji,
    isFlipped: false,
    isMatched: false,
  }));
};

export default function MemoryGame() {
  const { t } = useTranslation();
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [time, setTime] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [bestScores, setBestScores] = useState<Record<string, number>>({});
  const [isChecking, setIsChecking] = useState(false);

  const getDifficultySettings = (diff: typeof difficulty) => {
    switch (diff) {
      case 'easy':
        return { pairs: 4, cols: 4, label: t({ en: 'Easy (4 pairs)', pt: 'Easy (4 pairs)' }) };
      case 'hard':
        return { pairs: 8, cols: 4, label: t({ en: 'Hard (8 pairs)', pt: 'Hard (8 pairs)' }) };
      default:
        return { pairs: 6, cols: 4, label: t({ en: 'Normal (6 pairs)', pt: 'Normal (6 pairs)' }) };
    }
  };

  const settings = getDifficultySettings(difficulty);

  useEffect(() => {
    startNewGame();
  }, [difficulty]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameOver) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameOver]);

  const startNewGame = useCallback(() => {
    setCards(createCards(settings.pairs));
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameStarted(false);
    setGameOver(false);
    setTime(0);
    setIsChecking(false);
  }, [settings.pairs]);

  const handleCardClick = useCallback(
    (cardId: number) => {
      if (isChecking) return;

      const card = cards[cardId];
      if (card.isFlipped || card.isMatched || flippedCards.length >= 2) return;

      if (!gameStarted) {
        setGameStarted(true);
      }

      const newFlippedCards = [...flippedCards, cardId];
      setFlippedCards(newFlippedCards);
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c))
      );

      if (newFlippedCards.length === 2) {
        setMoves((prev) => prev + 1);
        setIsChecking(true);

        const [firstId, secondId] = newFlippedCards;
        const firstCard = cards[firstId];
        const secondCard = cards[secondId];

        if (firstCard.emoji === secondCard.emoji) {
          // Match!
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId
                  ? { ...c, isMatched: true }
                  : c
              )
            );
            setMatches((prev) => {
              const newMatches = prev + 1;
              if (newMatches === settings.pairs) {
                setGameOver(true);
                // Update best score
                setBestScores((prev) => {
                  const currentBest = prev[difficulty];
                  if (!currentBest || time < currentBest) {
                    return { ...prev, [difficulty]: time };
                  }
                  return prev;
                });
              }
              return newMatches;
            });
            setFlippedCards([]);
            setIsChecking(false);
          }, 500);
        } else {
          // No match
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId
                  ? { ...c, isFlipped: false }
                  : c
              )
            );
            setFlippedCards([]);
            setIsChecking(false);
          }, 1000);
        }
      }
    },
    [cards, flippedCards, gameStarted, isChecking, settings.pairs, time, difficulty]
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Difficulty selection */}
      <div className="flex justify-center gap-2 mb-6">
        {(['easy', 'normal', 'hard'] as const).map((diff) => (
          <button
            key={diff}
            onClick={() => setDifficulty(diff)}
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

      {/* Game info */}
      <div className="flex justify-between items-center mb-6 p-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)]">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-500">{formatTime(time)}</div>
          <div className="text-sm text-[var(--color-text-muted)]">{t({ en: 'Time', pt: 'Time' })}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{matches}/{settings.pairs}</div>
          <div className="text-sm text-[var(--color-text-muted)]">{t({ en: 'Matches', pt: 'Matches' })}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-500">{moves}</div>
          <div className="text-sm text-[var(--color-text-muted)]">{t({ en: 'Moves', pt: 'Moves' })}</div>
        </div>
      </div>

      {/* Card grid */}
      <div
        className="grid gap-2 mb-6"
        style={{ gridTemplateColumns: `repeat(${settings.cols}, 1fr)` }}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.isFlipped || card.isMatched || isChecking}
            className={`aspect-square rounded-xl text-3xl md:text-4xl flex items-center justify-center transition-all duration-300 transform ${
              card.isFlipped || card.isMatched
                ? 'bg-white dark:bg-gray-700 rotate-0'
                : 'bg-gradient-to-br from-primary-500 to-purple-500 rotate-0 hover:scale-105'
            } ${card.isMatched ? 'opacity-70 scale-95' : ''}`}
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {card.isFlipped || card.isMatched ? (
              <span className="animate-flip-in">{card.emoji}</span>
            ) : (
              <span className="text-white text-2xl">❓</span>
            )}
          </button>
        ))}
      </div>

      {/* Game over */}
      {gameOver && (
        <div className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500 text-center mb-6 animate-bounce">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold mb-2">{t({ en: 'Congratulations!', pt: 'Congratulations!' })}</h3>
          <p className="text-[var(--color-text-muted)] mb-4">
            {formatTime(time)} / {moves} {t({ en: 'moves', pt: 'moves' })}
          </p>
          <button
            onClick={startNewGame}
            className="px-6 py-3 bg-primary-500 text-white rounded-lg font-bold hover:bg-primary-600"
          >
            {t({ en: 'Play Again', pt: 'Play Again' })}
          </button>
        </div>
      )}

      {/* New game button */}
      {!gameOver && (
        <button
          onClick={startNewGame}
          className="w-full py-3 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card)] transition-colors"
        >
          {t({ en: 'New Game', pt: 'New Game' })}
        </button>
      )}

      {/* Best scores */}
      {Object.keys(bestScores).length > 0 && (
        <div className="mt-6 p-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)]">
          <h3 className="font-bold mb-3 text-center">{t({ en: '🏆 Best Scores', pt: '🏆 Best Scores' })}</h3>
          <div className="space-y-2">
            {(['easy', 'normal', 'hard'] as const).map((diff) => {
              const score = bestScores[diff];
              if (!score) return null;
              return (
                <div
                  key={diff}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-[var(--color-text-muted)]">
                    {getDifficultySettings(diff).label}
                  </span>
                  <span className="font-bold text-yellow-500">{formatTime(score)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes flip-in {
          from { transform: rotateY(90deg); }
          to { transform: rotateY(0deg); }
        }
        .animate-flip-in {
          animation: flip-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
