'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

export default function SnakeGame() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const directionRef = useRef(direction);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('snake-highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // Generate random food position
  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;

      const keyMap: Record<string, Direction> = {
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        w: 'UP',
        s: 'DOWN',
        a: 'LEFT',
        d: 'RIGHT',
      };

      const newDirection = keyMap[e.key];
      if (!newDirection) return;

      const opposites: Record<Direction, Direction> = {
        UP: 'DOWN',
        DOWN: 'UP',
        LEFT: 'RIGHT',
        RIGHT: 'LEFT',
      };

      if (opposites[newDirection] !== directionRef.current) {
        setDirection(newDirection);
        directionRef.current = newDirection;
      }
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  // Game loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };

        switch (directionRef.current) {
          case 'UP': head.y -= 1; break;
          case 'DOWN': head.y += 1; break;
          case 'LEFT': head.x -= 1; break;
          case 'RIGHT': head.x += 1; break;
        }

        // Check wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          setGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          setScore(prev => {
            const newScore = prev + 10;
            if (newScore > highScore) {
              setHighScore(newScore);
              localStorage.setItem('snake-highscore', newScore.toString());
            }
            return newScore;
          });
          setFood(generateFood(newSnake));
          // Increase speed
          setSpeed(prev => Math.max(50, prev - 2));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, speed);
    return () => clearInterval(gameInterval);
  }, [isPlaying, gameOver, food, speed, highScore, generateFood]);

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#16213e';
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw snake
    snake.forEach((segment, index) => {
      const gradient = ctx.createLinearGradient(
        segment.x * CELL_SIZE,
        segment.y * CELL_SIZE,
        (segment.x + 1) * CELL_SIZE,
        (segment.y + 1) * CELL_SIZE
      );
      gradient.addColorStop(0, index === 0 ? '#4ade80' : '#22c55e');
      gradient.addColorStop(1, index === 0 ? '#22c55e' : '#16a34a');

      ctx.fillStyle = gradient;
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    });

    // Draw food
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }, [snake, food]);

  const startGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood([{ x: 10, y: 10 }]));
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setIsPlaying(true);
  };

  // Mobile controls
  const handleMobileControl = (dir: Direction) => {
    if (!isPlaying) return;
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };
    if (opposites[dir] !== directionRef.current) {
      setDirection(dir);
      directionRef.current = dir;
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg lg:max-w-2xl mx-auto px-4">
      {/* Score */}
      <div className="flex justify-between items-center w-full mb-4 p-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)]">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{score}</div>
          <div className="text-sm text-[var(--color-text-muted)]">
            {t({ en: 'Score', pt: 'Score' })}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-500">{highScore}</div>
          <div className="text-sm text-[var(--color-text-muted)]">
            {t({ en: 'High Score', pt: 'High Score' })}
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="rounded-xl border-2 border-[var(--color-border)]"
        />

        {/* Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl">
            {gameOver && (
              <div className="text-3xl mb-4">
                {t({ en: 'Game Over!', pt: 'Game Over!' })}
              </div>
            )}
            <button
              onClick={startGame}
              className="px-8 py-4 bg-green-500 text-white text-xl font-bold rounded-full hover:bg-green-600 transition-colors"
            >
              {gameOver
                ? t({ en: 'Play Again', pt: 'Play Again' })
                : t({ en: 'Start', pt: 'Start' })}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="mt-6 grid grid-cols-3 gap-2 md:hidden">
        <div />
        <button
          onClick={() => handleMobileControl('UP')}
          className="p-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] active:bg-[var(--color-card-hover)]"
        >
          ⬆️
        </button>
        <div />
        <button
          onClick={() => handleMobileControl('LEFT')}
          className="p-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] active:bg-[var(--color-card-hover)]"
        >
          ⬅️
        </button>
        <button
          onClick={() => handleMobileControl('DOWN')}
          className="p-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] active:bg-[var(--color-card-hover)]"
        >
          ⬇️
        </button>
        <button
          onClick={() => handleMobileControl('RIGHT')}
          className="p-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] active:bg-[var(--color-card-hover)]"
        >
          ➡️
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
        <p className="hidden md:block">
          {t({ en: 'Use arrow keys or WASD to control', pt: 'Use arrow keys or WASD to control' })}
        </p>
        <p className="md:hidden">
          {t({ en: 'Tap buttons to change direction', pt: 'Tap buttons to change direction' })}
        </p>
      </div>
    </div>
  );
}
