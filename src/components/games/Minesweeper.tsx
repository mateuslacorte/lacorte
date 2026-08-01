'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

type CellState = 'hidden' | 'revealed' | 'flagged';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Cell {
  isMine: boolean;
  state: CellState;
  adjacentMines: number;
}

interface DifficultyConfig {
  rows: number;
  cols: number;
  mines: number;
  label: { en: string; pt?: string };
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { rows: 8, cols: 8, mines: 10, label: { en: 'Easy (8x8)', pt: 'Easy (8x8)' } },
  medium: { rows: 12, cols: 12, mines: 30, label: { en: 'Medium (12x12)', pt: 'Medium (12x12)' } },
  hard: { rows: 16, cols: 16, mines: 50, label: { en: 'Hard (16x16)', pt: 'Hard (16x16)' } },
};

export default function Minesweeper() {
  const { t } = useTranslation();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [started, setStarted] = useState(false);
  const [flagCount, setFlagCount] = useState(0);

  const config = DIFFICULTIES[difficulty];

  // Initialize board
  const initBoard = useCallback((excludeRow?: number, excludeCol?: number) => {
    const { rows, cols, mines } = config;

    // Create empty board
    const newBoard: Cell[][] = Array(rows)
      .fill(null)
      .map(() =>
        Array(cols)
          .fill(null)
          .map(() => ({
            isMine: false,
            state: 'hidden' as CellState,
            adjacentMines: 0,
          }))
      );

    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);

      // Don't place mine on first click or adjacent cells
      if (
        !newBoard[row][col].isMine &&
        !(excludeRow !== undefined && Math.abs(row - excludeRow) <= 1 && Math.abs(col - excludeCol!) <= 1)
      ) {
        newBoard[row][col].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate adjacent mines
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (!newBoard[i][j].isMine) {
          let count = 0;
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              const ni = i + di;
              const nj = j + dj;
              if (ni >= 0 && ni < rows && nj >= 0 && nj < cols && newBoard[ni][nj].isMine) {
                count++;
              }
            }
          }
          newBoard[i][j].adjacentMines = count;
        }
      }
    }

    return newBoard;
  }, [config]);

  // Reveal cell
  const revealCell = useCallback((board: Cell[][], row: number, col: number): Cell[][] => {
    const { rows, cols } = config;
    const newBoard = board.map(r => r.map(c => ({ ...c })));

    const reveal = (r: number, c: number) => {
      if (r < 0 || r >= rows || c < 0 || c >= cols) return;
      if (newBoard[r][c].state !== 'hidden') return;

      newBoard[r][c].state = 'revealed';

      if (newBoard[r][c].adjacentMines === 0 && !newBoard[r][c].isMine) {
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            reveal(r + di, c + dj);
          }
        }
      }
    };

    reveal(row, col);
    return newBoard;
  }, [config]);

  // Check win condition
  const checkWin = useCallback((board: Cell[][]): boolean => {
    return board.every(row =>
      row.every(cell => cell.isMine || cell.state === 'revealed')
    );
  }, []);

  // Handle cell click
  const handleClick = (row: number, col: number) => {
    if (gameOver || won) return;

    let currentBoard = board;

    // First click - initialize board (also ensures the clicked cell starts as hidden)
    if (!started) {
      currentBoard = initBoard(row, col);
      setStarted(true);
    }

    // If we're already started, block clicks on non-hidden cells.
    // For the first click, `initBoard` ensures `state === 'hidden'`.
    if (currentBoard[row]?.[col]?.state !== 'hidden') return;

    const cell = currentBoard[row][col];

    if (cell.isMine) {
      // Game over - reveal all mines
      const newBoard = currentBoard.map(r =>
        r.map(c => ({
          ...c,
          state: c.isMine ? 'revealed' as CellState : c.state,
        }))
      );
      setBoard(newBoard);
      setGameOver(true);
      return;
    }

    const newBoard = revealCell(currentBoard, row, col);
    setBoard(newBoard);

    if (checkWin(newBoard)) {
      setWon(true);
    }
  };

  // Handle right click (flag)
  const handleRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (gameOver || won || !started) return;
    if (board[row][col].state === 'revealed') return;

    const newBoard = board.map(r => r.map(c => ({ ...c })));
    const cell = newBoard[row][col];

    if (cell.state === 'hidden') {
      cell.state = 'flagged';
      setFlagCount(prev => prev + 1);
    } else if (cell.state === 'flagged') {
      cell.state = 'hidden';
      setFlagCount(prev => prev - 1);
    }

    setBoard(newBoard);
  };

  // Reset game
  const resetGame = () => {
    setBoard([]);
    setGameOver(false);
    setWon(false);
    setStarted(false);
    setFlagCount(0);
  };

  // Change difficulty
  const changeDifficulty = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    resetGame();
  };

  // Get cell display
  const getCellContent = (cell: Cell) => {
    if (cell.state === 'flagged') return '🚩';
    if (cell.state === 'hidden') return '';
    if (cell.isMine) return '💣';
    if (cell.adjacentMines === 0) return '';
    return cell.adjacentMines;
  };

  const getCellColor = (count: number) => {
    const colors = ['', 'text-blue-500', 'text-green-500', 'text-red-500', 'text-purple-500', 'text-yellow-600', 'text-cyan-500', 'text-gray-700', 'text-gray-500'];
    return colors[count] || '';
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg lg:max-w-2xl mx-auto px-4">
      {/* Difficulty */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {(Object.entries(DIFFICULTIES) as [Difficulty, DifficultyConfig][]).map(([diff, cfg]) => (
          <button
            key={diff}
            onClick={() => changeDifficulty(diff)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              difficulty === diff
                ? 'bg-primary-500 text-white'
                : 'bg-[var(--color-card)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)]'
            }`}
          >
            {t(cfg.label)}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-4 p-3 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)]">
        <div className="text-center">
          <div className="text-xl font-bold">💣</div>
          <div className="text-sm">{config.mines - flagCount}</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold">🚩</div>
          <div className="text-sm">{flagCount}</div>
        </div>
      </div>

      {/* Board */}
      <div
        className="inline-grid gap-0.5 p-2 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)]"
        style={{
          gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
        }}
      >
        {(started ? board : Array(config.rows).fill(Array(config.cols).fill({ state: 'hidden', isMine: false, adjacentMines: 0 }))).map((row, i) =>
          row.map((cell: Cell, j: number) => (
            <button
              key={`${i}-${j}`}
              onClick={() => handleClick(i, j)}
              onContextMenu={(e) => handleRightClick(e, i, j)}
              disabled={gameOver || won}
              className={`w-6 h-6 md:w-7 md:h-7 text-xs md:text-sm font-bold flex items-center justify-center transition-colors ${
                cell.state === 'revealed'
                  ? cell.isMine
                    ? 'bg-red-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                  : 'bg-gray-400 dark:bg-gray-600 hover:bg-gray-500 dark:hover:bg-gray-500'
              } ${getCellColor(cell.adjacentMines)}`}
            >
              {getCellContent(cell)}
            </button>
          ))
        )}
      </div>

      {/* Game Status */}
      {(gameOver || won) && (
        <div className={`mt-4 p-4 rounded-xl text-center ${won ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'}`}>
          <div className="text-2xl font-bold">
            {won
              ? t({ en: '🎉 You Win!', pt: '🎉 You Win!' })
              : t({ en: '💥 Game Over', pt: '💥 Game Over' })}
          </div>
        </div>
      )}

      {/* New Game Button */}
      <button
        onClick={resetGame}
        className="mt-4 px-6 py-3 bg-primary-500 text-white font-bold rounded-lg hover:bg-primary-600 transition-colors"
      >
        {t({ en: 'New Game', pt: 'New Game' })}
      </button>

      {/* Instructions */}
      <div className="mt-4 text-sm text-[var(--color-text-muted)] text-center">
        <p>{t({ en: 'Click: Reveal | Right-click: Flag', pt: 'Click: Reveal | Right-click: Flag' })}</p>
      </div>
    </div>
  );
}
