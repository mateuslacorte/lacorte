'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

interface Obstacle {
  x: number;
  width: number;
  height: number;
  type: 'cactus' | 'bird';
}

const GROUND_HEIGHT = 20;
const DINO_WIDTH = 40;
const DINO_HEIGHT = 50;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const INITIAL_SPEED = 5;

export default function DinoRunner() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const gameStateRef = useRef({
    dinoY: 0,
    dinoVelocity: 0,
    isJumping: false,
    isDucking: false,
    obstacles: [] as Obstacle[],
    speed: INITIAL_SPEED,
    frameCount: 0,
  });

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('dino-highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // Jump handler
  const jump = useCallback(() => {
    const state = gameStateRef.current;
    if (!state.isJumping && !state.isDucking) {
      state.dinoVelocity = JUMP_FORCE;
      state.isJumping = true;
    }
  }, []);

  // Duck handler
  const duck = useCallback((isDucking: boolean) => {
    const state = gameStateRef.current;
    if (!state.isJumping) {
      state.isDucking = isDucking;
    }
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!isPlaying && !gameOver) {
          startGame();
        } else if (gameOver) {
          startGame();
        } else {
          jump();
        }
      }
      if (e.code === 'ArrowDown') {
        e.preventDefault();
        duck(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') {
        duck(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, gameOver, jump, duck]);

  // Start game
  const startGame = () => {
    gameStateRef.current = {
      dinoY: 0,
      dinoVelocity: 0,
      isJumping: false,
      isDucking: false,
      obstacles: [],
      speed: INITIAL_SPEED,
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

    const width = canvas.width;
    const height = canvas.height;
    const groundY = height - GROUND_HEIGHT;
    const state = gameStateRef.current;

    let animationId: number;

    const gameLoop = () => {
      state.frameCount++;

      // Update dino position
      state.dinoVelocity += GRAVITY;
      state.dinoY += state.dinoVelocity;

      // Ground collision
      if (state.dinoY >= 0) {
        state.dinoY = 0;
        state.dinoVelocity = 0;
        state.isJumping = false;
      }

      // Spawn obstacles
      if (state.frameCount % Math.floor(100 / (state.speed / INITIAL_SPEED)) === 0) {
        if (Math.random() < 0.5) {
          const type = Math.random() < 0.8 ? 'cactus' : 'bird';
          state.obstacles.push({
            x: width,
            width: type === 'cactus' ? 20 + Math.random() * 20 : 30,
            height: type === 'cactus' ? 30 + Math.random() * 20 : 25,
            type,
          });
        }
      }

      // Update obstacles
      state.obstacles = state.obstacles.filter(obs => {
        obs.x -= state.speed;
        return obs.x > -obs.width;
      });

      // Increase speed
      if (state.frameCount % 500 === 0) {
        state.speed += 0.5;
      }

      // Check collision
      const dinoHeight = state.isDucking ? DINO_HEIGHT * 0.5 : DINO_HEIGHT;
      const dinoTop = groundY - dinoHeight + state.dinoY;
      const dinoLeft = 50;
      const dinoRight = dinoLeft + DINO_WIDTH;
      const dinoBottom = groundY + state.dinoY;

      for (const obs of state.obstacles) {
        const obsTop = obs.type === 'bird' ? groundY - 60 : groundY - obs.height;
        const obsBottom = obs.type === 'bird' ? obsTop + obs.height : groundY;
        const obsLeft = obs.x;
        const obsRight = obs.x + obs.width;

        if (
          dinoRight > obsLeft &&
          dinoLeft < obsRight &&
          dinoBottom > obsTop &&
          dinoTop < obsBottom
        ) {
          setIsPlaying(false);
          setGameOver(true);
          const finalScore = Math.floor(state.frameCount / 10);
          setScore(finalScore);
          if (finalScore > highScore) {
            setHighScore(finalScore);
            localStorage.setItem('dino-highscore', finalScore.toString());
          }
          return;
        }
      }

      // Update score
      setScore(Math.floor(state.frameCount / 10));

      // Draw
      // Clear
      ctx.fillStyle = '#f7f7f7';
      ctx.fillRect(0, 0, width, height);

      // Ground
      ctx.fillStyle = '#535353';
      ctx.fillRect(0, groundY, width, 2);

      // Dino
      const dinoX = 50;
      const dinoDrawY = groundY - dinoHeight + state.dinoY;

      ctx.fillStyle = '#535353';
      if (state.isDucking) {
        // Ducking dino
        ctx.fillRect(dinoX, dinoDrawY + DINO_HEIGHT * 0.25, DINO_WIDTH + 10, DINO_HEIGHT * 0.5);
      } else {
        // Standing dino
        // Body
        ctx.fillRect(dinoX + 10, dinoDrawY + 10, 25, 35);
        // Head
        ctx.fillRect(dinoX + 20, dinoDrawY, 20, 20);
        // Eye
        ctx.fillStyle = '#f7f7f7';
        ctx.fillRect(dinoX + 32, dinoDrawY + 5, 4, 4);
        // Legs
        ctx.fillStyle = '#535353';
        const legOffset = state.frameCount % 10 < 5 ? 0 : 5;
        ctx.fillRect(dinoX + 15, dinoDrawY + 40, 8, 10 + legOffset);
        ctx.fillRect(dinoX + 27, dinoDrawY + 40, 8, 10 - legOffset);
        // Tail
        ctx.fillRect(dinoX, dinoDrawY + 20, 15, 10);
      }

      // Obstacles
      for (const obs of state.obstacles) {
        ctx.fillStyle = obs.type === 'cactus' ? '#2d5a27' : '#535353';
        if (obs.type === 'cactus') {
          ctx.fillRect(obs.x, groundY - obs.height, obs.width, obs.height);
          // Cactus arms
          ctx.fillRect(obs.x - 5, groundY - obs.height + 10, 8, 15);
          ctx.fillRect(obs.x + obs.width - 3, groundY - obs.height + 15, 8, 12);
        } else {
          // Bird
          const birdY = groundY - 60;
          ctx.fillRect(obs.x, birdY, obs.width, obs.height);
          // Wings
          const wingOffset = state.frameCount % 10 < 5 ? -5 : 5;
          ctx.fillRect(obs.x + 5, birdY + wingOffset, 20, 5);
        }
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, highScore]);

  // Touch handler
  const handleTouch = () => {
    if (!isPlaying && !gameOver) {
      startGame();
    } else if (gameOver) {
      startGame();
    } else {
      jump();
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl lg:max-w-4xl mx-auto px-4">
      {/* Score */}
      <div className="flex justify-between items-center w-full mb-4 p-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)]">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-500">{score}</div>
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
      <div
        className="relative w-full"
        onClick={handleTouch}
        onTouchStart={handleTouch}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={200}
          className="w-full bg-[#f7f7f7] rounded-xl border-2 border-[var(--color-border)]"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-xl">
            {gameOver && (
              <>
                <div className="text-2xl font-bold text-white mb-2">
                  {t({ en: 'Game Over!', pt: 'Game Over!' })}
                </div>
                <div className="text-lg text-white/80 mb-4">
                  {t({ en: 'Score', pt: 'Score' })}: {score}
                </div>
              </>
            )}
            <div className="text-5xl mb-4">🦖</div>
            <div className="text-white text-lg">
              {t({ en: 'Press Space or tap to start', pt: 'Press Space or tap to start' })}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
        <p className="hidden md:block">
          {t({ en: 'Space/↑: Jump | ↓: Duck', pt: 'Space/↑: Jump | ↓: Duck' })}
        </p>
        <p className="md:hidden">
          {t({ en: 'Tap to jump', pt: 'Tap to jump' })}
        </p>
      </div>
    </div>
  );
}
