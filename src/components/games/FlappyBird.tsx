'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BIRD_SIZE = 30;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const GRAVITY = 0.5;
const JUMP_FORCE = -8;
const PIPE_SPEED = 3;

export default function FlappyBird() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const gameStateRef = useRef({
    birdY: CANVAS_HEIGHT / 2,
    birdVelocity: 0,
    pipes: [] as Pipe[],
    frameCount: 0,
  });

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('flappy-highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // Jump
  const jump = useCallback(() => {
    if (!isPlaying) return;
    gameStateRef.current.birdVelocity = JUMP_FORCE;
  }, [isPlaying]);

  // Handle input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!isPlaying && !gameOver) {
          startGame();
        } else if (gameOver) {
          startGame();
        } else {
          jump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver, jump]);

  // Start game
  const startGame = () => {
    gameStateRef.current = {
      birdY: CANVAS_HEIGHT / 2,
      birdVelocity: 0,
      pipes: [],
      frameCount: 0,
    };
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  };

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
      state.frameCount++;

      // Update bird
      state.birdVelocity += GRAVITY;
      state.birdY += state.birdVelocity;

      // Spawn pipes
      if (state.frameCount % 100 === 0) {
        const gapY = Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 100) + 50;
        state.pipes.push({ x: CANVAS_WIDTH, gapY, passed: false });
      }

      // Update pipes
      state.pipes = state.pipes.filter(pipe => {
        pipe.x -= PIPE_SPEED;
        return pipe.x > -PIPE_WIDTH;
      });

      // Check collisions
      const birdLeft = 50;
      const birdRight = birdLeft + BIRD_SIZE;
      const birdTop = state.birdY;
      const birdBottom = state.birdY + BIRD_SIZE;

      // Ground/ceiling collision
      if (birdTop < 0 || birdBottom > CANVAS_HEIGHT) {
        endGame();
        return;
      }

      // Pipe collision
      for (const pipe of state.pipes) {
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + PIPE_WIDTH;

        if (birdRight > pipeLeft && birdLeft < pipeRight) {
          // Check if bird is in the gap
          if (birdTop < pipe.gapY || birdBottom > pipe.gapY + PIPE_GAP) {
            endGame();
            return;
          }
        }

        // Score
        if (!pipe.passed && pipe.x + PIPE_WIDTH < birdLeft) {
          pipe.passed = true;
          setScore(prev => prev + 1);
        }
      }

      // Draw
      // Sky
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#E0F6FF');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(50 - (state.frameCount * 0.5) % (CANVAS_WIDTH + 100), 80, 30, 0, Math.PI * 2);
      ctx.arc(80 - (state.frameCount * 0.5) % (CANVAS_WIDTH + 100), 70, 25, 0, Math.PI * 2);
      ctx.arc(110 - (state.frameCount * 0.5) % (CANVAS_WIDTH + 100), 80, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(250 - (state.frameCount * 0.3) % (CANVAS_WIDTH + 100), 150, 25, 0, Math.PI * 2);
      ctx.arc(280 - (state.frameCount * 0.3) % (CANVAS_WIDTH + 100), 140, 20, 0, Math.PI * 2);
      ctx.fill();

      // Pipes
      for (const pipe of state.pipes) {
        // Top pipe
        ctx.fillStyle = '#2ECC71';
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
        ctx.fillStyle = '#27AE60';
        ctx.fillRect(pipe.x - 5, pipe.gapY - 20, PIPE_WIDTH + 10, 20);

        // Bottom pipe
        ctx.fillStyle = '#2ECC71';
        ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.gapY - PIPE_GAP);
        ctx.fillStyle = '#27AE60';
        ctx.fillRect(pipe.x - 5, pipe.gapY + PIPE_GAP, PIPE_WIDTH + 10, 20);
      }

      // Bird
      ctx.save();
      ctx.translate(50 + BIRD_SIZE / 2, state.birdY + BIRD_SIZE / 2);
      ctx.rotate(Math.min(state.birdVelocity * 0.05, 0.5));

      // Body
      ctx.fillStyle = '#F1C40F';
      ctx.beginPath();
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wing
      ctx.fillStyle = '#E67E22';
      const wingOffset = Math.sin(state.frameCount * 0.3) * 5;
      ctx.beginPath();
      ctx.ellipse(-5, wingOffset, 10, 6, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(8, -5, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(10, -5, 4, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#E74C3C';
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(25, 3);
      ctx.lineTo(15, 6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      animationId = requestAnimationFrame(gameLoop);
    };

    const endGame = () => {
      cancelAnimationFrame(animationId);
      setIsPlaying(false);
      setGameOver(true);
      const finalScore = score;
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem('flappy-highscore', finalScore.toString());
      }
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, score, highScore]);

  // Handle touch/click
  const handleInteraction = () => {
    if (!isPlaying && !gameOver) {
      startGame();
    } else if (gameOver) {
      startGame();
    } else {
      jump();
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md lg:max-w-lg mx-auto px-4">
      {/* Score */}
      <div className="flex gap-4 mb-4 p-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)]">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-500">{score}</div>
          <div className="text-sm text-[var(--color-text-muted)]">
            {t({ en: 'Score', pt: 'Score' })}
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
      <div
        className="relative cursor-pointer"
        onClick={handleInteraction}
        onTouchStart={handleInteraction}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-xl border-2 border-[var(--color-border)] max-w-full"
          style={{ maxHeight: '70vh' }}
        />

        {/* Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-xl">
            {gameOver && (
              <>
                <div className="text-3xl font-bold text-white mb-2">
                  {t({ en: 'Game Over!', pt: 'Game Over!' })}
                </div>
                <div className="text-xl text-white/80 mb-4">
                  {t({ en: 'Score', pt: 'Score' })}: {score}
                </div>
              </>
            )}
            <div className="text-6xl mb-4">🐦</div>
            <div className="text-white text-lg text-center px-4">
              {t({ en: 'Press Space or tap to flap!', pt: 'Press Space or tap to flap!' })}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
        <p>
          {t({ en: 'Fly through the pipes', pt: 'Fly through the pipes' })}
        </p>
      </div>
    </div>
  );
}
