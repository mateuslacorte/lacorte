'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const BALL_RADIUS = 8;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 54;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 4;
const BRICK_TOP = 60;

const BRICK_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

export default function Breakout() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);

  const gameStateRef = useRef({
    paddleX: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT - 100,
    ballDX: 4,
    ballDY: -4,
    bricks: [] as boolean[][],
  });

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('breakout-highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // Initialize bricks
  const initBricks = useCallback(() => {
    const bricks: boolean[][] = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      bricks[r] = [];
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks[r][c] = true;
      }
    }
    return bricks;
  }, []);

  // Start game
  const startGame = () => {
    gameStateRef.current = {
      paddleX: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
      ballX: CANVAS_WIDTH / 2,
      ballY: CANVAS_HEIGHT - 100,
      ballDX: 4 * (Math.random() > 0.5 ? 1 : -1),
      ballDY: -4,
      bricks: initBricks(),
    };
    setScore(0);
    setLives(3);
    setGameOver(false);
    setWon(false);
    setIsPlaying(true);
  };

  // Handle mouse/touch movement
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMove = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const relativeX = (clientX - rect.left) * scaleX;
      gameStateRef.current.paddleX = Math.max(
        0,
        Math.min(CANVAS_WIDTH - PADDLE_WIDTH, relativeX - PADDLE_WIDTH / 2)
      );
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isPlaying) handleMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isPlaying) {
        e.preventDefault();
        handleMove(e.touches[0].clientX);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isPlaying]);

  // Game loop
  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const gameLoop = () => {
      const state = gameStateRef.current;

      // Move ball
      state.ballX += state.ballDX;
      state.ballY += state.ballDY;

      // Wall collision
      if (state.ballX - BALL_RADIUS < 0 || state.ballX + BALL_RADIUS > CANVAS_WIDTH) {
        state.ballDX = -state.ballDX;
      }
      if (state.ballY - BALL_RADIUS < 0) {
        state.ballDY = -state.ballDY;
      }

      // Bottom collision (lose life)
      if (state.ballY + BALL_RADIUS > CANVAS_HEIGHT) {
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setIsPlaying(false);
            setGameOver(true);
            if (score > highScore) {
              setHighScore(score);
              localStorage.setItem('breakout-highscore', score.toString());
            }
          } else {
            // Reset ball position
            state.ballX = CANVAS_WIDTH / 2;
            state.ballY = CANVAS_HEIGHT - 100;
            state.ballDX = 4 * (Math.random() > 0.5 ? 1 : -1);
            state.ballDY = -4;
          }
          return newLives;
        });
      }

      // Paddle collision
      if (
        state.ballY + BALL_RADIUS > CANVAS_HEIGHT - PADDLE_HEIGHT - 10 &&
        state.ballY + BALL_RADIUS < CANVAS_HEIGHT - 10 &&
        state.ballX > state.paddleX &&
        state.ballX < state.paddleX + PADDLE_WIDTH
      ) {
        state.ballDY = -Math.abs(state.ballDY);
        // Adjust angle based on where ball hits paddle
        const hitPoint = (state.ballX - state.paddleX) / PADDLE_WIDTH;
        state.ballDX = 8 * (hitPoint - 0.5);
      }

      // Brick collision
      let bricksRemaining = 0;
      const brickStartX = (CANVAS_WIDTH - (BRICK_COLS * (BRICK_WIDTH + BRICK_PADDING))) / 2;

      for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
          if (state.bricks[r][c]) {
            bricksRemaining++;
            const brickX = brickStartX + c * (BRICK_WIDTH + BRICK_PADDING);
            const brickY = BRICK_TOP + r * (BRICK_HEIGHT + BRICK_PADDING);

            if (
              state.ballX > brickX &&
              state.ballX < brickX + BRICK_WIDTH &&
              state.ballY > brickY &&
              state.ballY < brickY + BRICK_HEIGHT
            ) {
              state.bricks[r][c] = false;
              state.ballDY = -state.ballDY;
              setScore(prev => prev + (BRICK_ROWS - r) * 10);
            }
          }
        }
      }

      // Check win
      if (bricksRemaining === 0) {
        setIsPlaying(false);
        setWon(true);
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem('breakout-highscore', score.toString());
        }
        return;
      }

      // Draw
      // Background
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Bricks
      for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
          if (state.bricks[r][c]) {
            const brickX = brickStartX + c * (BRICK_WIDTH + BRICK_PADDING);
            const brickY = BRICK_TOP + r * (BRICK_HEIGHT + BRICK_PADDING);

            ctx.fillStyle = BRICK_COLORS[r];
            ctx.fillRect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT);

            // Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(brickX, brickY, BRICK_WIDTH, 3);
          }
        }
      }

      // Paddle
      const gradient = ctx.createLinearGradient(
        state.paddleX,
        CANVAS_HEIGHT - PADDLE_HEIGHT - 10,
        state.paddleX,
        CANVAS_HEIGHT - 10
      );
      gradient.addColorStop(0, '#4f46e5');
      gradient.addColorStop(1, '#7c3aed');
      ctx.fillStyle = gradient;
      ctx.fillRect(state.paddleX, CANVAS_HEIGHT - PADDLE_HEIGHT - 10, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Ball
      ctx.beginPath();
      ctx.arc(state.ballX, state.ballY, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, score, highScore, initBricks]);

  return (
    <div className="flex flex-col items-center w-full max-w-lg lg:max-w-xl mx-auto px-4">
      {/* Stats */}
      <div className="flex gap-4 mb-4 p-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)]">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-500">{score}</div>
          <div className="text-sm text-[var(--color-text-muted)]">
            {t({ en: 'Score', pt: 'Score' })}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-500">{'❤️'.repeat(lives)}</div>
          <div className="text-sm text-[var(--color-text-muted)]">
            {t({ en: 'Lives', pt: 'Lives' })}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-500">{highScore}</div>
          <div className="text-sm text-[var(--color-text-muted)]">
            {t({ en: 'Best', pt: 'Best' })}
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-xl border-2 border-[var(--color-border)] max-w-full touch-none"
          style={{ maxHeight: '60vh' }}
        />

        {/* Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl">
            {(gameOver || won) && (
              <>
                <div className="text-3xl font-bold text-white mb-2">
                  {won
                    ? t({ en: 'You Win!', pt: 'You Win!' })
                    : t({ en: 'Game Over', pt: 'Game Over' })}
                </div>
                <div className="text-xl text-white/80 mb-4">
                  {t({ en: 'Score', pt: 'Score' })}: {score}
                </div>
              </>
            )}
            <div className="text-5xl mb-4">🧱</div>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-primary-500 text-white text-xl font-bold rounded-full hover:bg-primary-600 transition-colors"
            >
              {gameOver || won
                ? t({ en: 'Play Again', pt: 'Play Again' })
                : t({ en: 'Start', pt: 'Start' })}
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
        <p>
          {t({ en: 'Move paddle with mouse or touch', pt: 'Move paddle with mouse or touch' })}
        </p>
      </div>
    </div>
  );
}
