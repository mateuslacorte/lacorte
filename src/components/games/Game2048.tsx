'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

type Grid = (number | null)[][];

const GRID_SIZE = 4;

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  2: { bg: '#eee4da', text: '#776e65' },
  4: { bg: '#ede0c8', text: '#776e65' },
  8: { bg: '#f2b179', text: '#f9f6f2' },
  16: { bg: '#f59563', text: '#f9f6f2' },
  32: { bg: '#f67c5f', text: '#f9f6f2' },
  64: { bg: '#f65e3b', text: '#f9f6f2' },
  128: { bg: '#edcf72', text: '#f9f6f2' },
  256: { bg: '#edcc61', text: '#f9f6f2' },
  512: { bg: '#edc850', text: '#f9f6f2' },
  1024: { bg: '#edc53f', text: '#f9f6f2' },
  2048: { bg: '#edc22e', text: '#f9f6f2' },
};

const createEmptyGrid = (): Grid => {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
};

const addRandomTile = (grid: Grid): Grid => {
  const newGrid = grid.map(row => [...row]);
  const emptyCells: { row: number; col: number }[] = [];

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (newGrid[i][j] === null) {
        emptyCells.push({ row: i, col: j });
      }
    }
  }

  if (emptyCells.length > 0) {
    const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    newGrid[row][col] = Math.random() < 0.9 ? 2 : 4;
  }

  return newGrid;
};

const rotateGrid = (grid: Grid): Grid => {
  const newGrid = createEmptyGrid();
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      newGrid[i][j] = grid[GRID_SIZE - 1 - j][i];
    }
  }
  return newGrid;
};

const slideRow = (row: (number | null)[]): { newRow: (number | null)[]; score: number } => {
  const filtered = row.filter(cell => cell !== null) as number[];
  const merged: number[] = [];
  let score = 0;

  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === filtered[i + 1]) {
      const mergedValue = filtered[i] * 2;
      merged.push(mergedValue);
      score += mergedValue;
      i++;
    } else {
      merged.push(filtered[i]);
    }
  }

  while (merged.length < GRID_SIZE) {
    merged.push(null as unknown as number);
  }

  return { newRow: merged.map(v => v || null), score };
};

const moveLeft = (grid: Grid): { newGrid: Grid; score: number; moved: boolean } => {
  let totalScore = 0;
  let moved = false;

  const newGrid = grid.map(row => {
    const { newRow, score } = slideRow(row);
    totalScore += score;
    if (JSON.stringify(row) !== JSON.stringify(newRow)) {
      moved = true;
    }
    return newRow;
  });

  return { newGrid, score: totalScore, moved };
};

const move = (grid: Grid, direction: 'left' | 'right' | 'up' | 'down'): { newGrid: Grid; score: number; moved: boolean } => {
  let rotatedGrid = grid;
  const rotations = { left: 0, up: 1, right: 2, down: 3 };

  for (let i = 0; i < rotations[direction]; i++) {
    rotatedGrid = rotateGrid(rotatedGrid);
  }

  const { newGrid, score, moved } = moveLeft(rotatedGrid);

  let resultGrid = newGrid;
  for (let i = 0; i < (4 - rotations[direction]) % 4; i++) {
    resultGrid = rotateGrid(resultGrid);
  }

  return { newGrid: resultGrid, score, moved };
};

const canMove = (grid: Grid): boolean => {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid[i][j] === null) return true;
      if (j < GRID_SIZE - 1 && grid[i][j] === grid[i][j + 1]) return true;
      if (i < GRID_SIZE - 1 && grid[i][j] === grid[i + 1][j]) return true;
    }
  }
  return false;
};

const hasWon = (grid: Grid): boolean => {
  return grid.some(row => row.some(cell => cell === 2048));
};

export default function Game2048() {
  const { t } = useTranslation();
  const [grid, setGrid] = useState<Grid>(() => {
    let newGrid = createEmptyGrid();
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    return newGrid;
  });
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  // Load best score
  useEffect(() => {
    const saved = localStorage.getItem('2048-bestscore');
    if (saved) setBestScore(parseInt(saved));
  }, []);

  // Handle keyboard input
  const handleMove = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameOver && !won) return;

    const { newGrid, score: moveScore, moved } = move(grid, direction);

    if (moved) {
      const gridWithNewTile = addRandomTile(newGrid);
      setGrid(gridWithNewTile);

      const newScore = score + moveScore;
      setScore(newScore);

      if (newScore > bestScore) {
        setBestScore(newScore);
        localStorage.setItem('2048-bestscore', newScore.toString());
      }

      if (hasWon(gridWithNewTile) && !won) {
        setWon(true);
      }

      if (!canMove(gridWithNewTile)) {
        setGameOver(true);
      }
    }
  }, [grid, score, bestScore, gameOver, won]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, 'left' | 'right' | 'up' | 'down'> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      };

      if (keyMap[e.key]) {
        e.preventDefault();
        handleMove(keyMap[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  // Touch handling
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 30) {
      if (absDx > absDy) {
        handleMove(dx > 0 ? 'right' : 'left');
      } else {
        handleMove(dy > 0 ? 'down' : 'up');
      }
    }
    setTouchStart(null);
  };

  const newGame = () => {
    let newGrid = createEmptyGrid();
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md lg:max-w-lg mx-auto px-4">
      {/* Header */}
      <div className="flex justify-between items-center w-full mb-4">
        <h1 className="text-4xl font-bold text-[#776e65]">2048</h1>
        <div className="flex gap-2">
          <div className="bg-[#bbada0] rounded-lg px-4 py-2 text-center">
            <div className="text-xs text-[#eee4da]">
              {t({ en: 'SCORE', pt: 'SCORE' })}
            </div>
            <div className="text-xl font-bold text-white">{score}</div>
          </div>
          <div className="bg-[#bbada0] rounded-lg px-4 py-2 text-center">
            <div className="text-xs text-[#eee4da]">
              {t({ en: 'BEST', pt: 'BEST' })}
            </div>
            <div className="text-xl font-bold text-white">{bestScore}</div>
          </div>
        </div>
      </div>

      {/* New Game Button */}
      <button
        onClick={newGame}
        className="mb-4 px-4 py-2 bg-[#8f7a66] text-white font-bold rounded-lg hover:bg-[#9f8b77] transition-colors"
      >
        {t({ en: 'New Game', pt: 'New Game' })}
      </button>

      {/* Game Grid */}
      <div
        className="relative bg-[#bbada0] rounded-xl p-3"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Grid */}
        <div className="grid grid-cols-4 gap-3">
          {Array(16).fill(null).map((_, i) => (
            <div
              key={i}
              className="w-16 h-16 md:w-20 md:h-20 bg-[#cdc1b4] rounded-lg"
            />
          ))}
        </div>

        {/* Tiles */}
        <div className="absolute inset-3 grid grid-cols-4 gap-3">
          {grid.map((row, i) =>
            row.map((cell, j) => (
              <div
                key={`${i}-${j}`}
                className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-lg font-bold transition-all duration-100"
                style={{
                  backgroundColor: cell ? TILE_COLORS[cell]?.bg || '#3c3a32' : 'transparent',
                  color: cell ? TILE_COLORS[cell]?.text || '#f9f6f2' : 'transparent',
                  fontSize: cell && cell >= 1024 ? '1.25rem' : cell && cell >= 100 ? '1.5rem' : '2rem',
                }}
              >
                {cell}
              </div>
            ))
          )}
        </div>

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/50 rounded-xl flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-white mb-4">
              {won
                ? t({ en: 'You Win!', pt: 'You Win!' })
                : t({ en: 'Game Over', pt: 'Game Over' })}
            </div>
            <button
              onClick={newGame}
              className="px-6 py-3 bg-[#8f7a66] text-white font-bold rounded-lg hover:bg-[#9f8b77] transition-colors"
            >
              {t({ en: 'Try Again', pt: 'Try Again' })}
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
        <p className="hidden md:block">
          {t({ en: 'Use arrow keys to move tiles. Merge tiles to reach 2048!', pt: 'Use arrow keys to move tiles. Merge tiles to reach 2048!' })}
        </p>
        <p className="md:hidden">
          {t({ en: 'Swipe to move tiles', pt: 'Swipe to move tiles' })}
        </p>
      </div>
    </div>
  );
}
