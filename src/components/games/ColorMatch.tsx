'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

const COLORS = [
  { name: { en: 'RED', pt: 'RED' }, value: '#ef4444' },
  { name: { en: 'BLUE', pt: 'BLUE' }, value: '#3b82f6' },
  { name: { en: 'GREEN', pt: 'GREEN' }, value: '#22c55e' },
  { name: { en: 'YELLOW', pt: 'YELLOW' }, value: '#eab308' },
  { name: { en: 'PURPLE', pt: 'PURPLE' }, value: '#a855f7' },
  { name: { en: 'ORANGE', pt: 'ORANGE' }, value: '#f97316' },
];

type GameMode = 'text-color' | 'color-text';

export default function ColorMatch() {
  const { t, lang } = useTranslation();
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<{
    text: string;
    textColor: string;
    correctAnswer: string;
  } | null>(null);
  const [options, setOptions] = useState<typeof COLORS>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [mode, setMode] = useState<GameMode>('text-color');
  const [streak, setStreak] = useState(0);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('colormatch-highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // Generate question
  const generateQuestion = useCallback(() => {
    const textColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    let displayColor = COLORS[Math.floor(Math.random() * COLORS.length)];

    // 30% chance to make them match
    if (Math.random() < 0.3) {
      displayColor = textColor;
    }

    // Shuffle options
    const shuffled = [...COLORS].sort(() => Math.random() - 0.5);

    setCurrentQuestion({
      text: textColor.name[lang as keyof typeof textColor.name] || textColor.name.en,
      textColor: displayColor.value,
      correctAnswer: mode === 'text-color' ? displayColor.value : textColor.value,
    });
    setOptions(shuffled);
  }, [lang, mode]);

  // Start game
  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setStreak(0);
    generateQuestion();
  };

  // Timer
  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsPlaying(false);
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('colormatch-highscore', score.toString());
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, score, highScore]);

  // Handle answer
  const handleAnswer = (colorValue: string) => {
    if (!currentQuestion || !isPlaying) return;

    const isCorrect = colorValue === currentQuestion.correctAnswer;

    if (isCorrect) {
      const newStreak = streak + 1;
      const points = 10 + Math.floor(newStreak / 3) * 5; // Bonus points for streaks
      setScore(prev => prev + points);
      setStreak(newStreak);
      setFeedback('correct');
    } else {
      setStreak(0);
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      generateQuestion();
    }, 200);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg lg:max-w-xl mx-auto px-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 w-full mb-6">
        <div className="p-3 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] text-center">
          <div className="text-2xl font-bold text-primary-500">{timeLeft}</div>
          <div className="text-xs text-[var(--color-text-muted)]">
            {t({ en: 'sec', pt: 'sec' })}
          </div>
        </div>
        <div className="p-3 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] text-center">
          <div className="text-2xl font-bold text-green-500">{score}</div>
          <div className="text-xs text-[var(--color-text-muted)]">
            {t({ en: 'Score', pt: 'Score' })}
          </div>
        </div>
        <div className="p-3 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] text-center">
          <div className="text-2xl font-bold text-orange-500">{streak}</div>
          <div className="text-xs text-[var(--color-text-muted)]">
            {t({ en: 'Streak', pt: 'Streak' })}
          </div>
        </div>
        <div className="p-3 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] text-center">
          <div className="text-2xl font-bold text-yellow-500">{highScore}</div>
          <div className="text-xs text-[var(--color-text-muted)]">
            {t({ en: 'Best', pt: 'Best' })}
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      {!isPlaying && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('text-color')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'text-color'
                ? 'bg-primary-500 text-white'
                : 'bg-[var(--color-card)] border border-[var(--color-border)]'
            }`}
          >
            {t({ en: 'Match Text Color', pt: 'Match Text Color' })}
          </button>
          <button
            onClick={() => setMode('color-text')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'color-text'
                ? 'bg-primary-500 text-white'
                : 'bg-[var(--color-card)] border border-[var(--color-border)]'
            }`}
          >
            {t({ en: 'Match Text Meaning', pt: 'Match Text Meaning' })}
          </button>
        </div>
      )}

      {/* Question */}
      <div
        className={`w-full p-8 bg-[var(--color-card)] rounded-xl border-2 mb-6 text-center transition-colors ${
          feedback === 'correct'
            ? 'border-green-500 bg-green-500/10'
            : feedback === 'wrong'
            ? 'border-red-500 bg-red-500/10'
            : 'border-[var(--color-border)]'
        }`}
      >
        {isPlaying && currentQuestion ? (
          <>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              {mode === 'text-color'
                ? t({ en: 'Select the TEXT COLOR', pt: 'Select the TEXT COLOR' })
                : t({ en: 'Select the TEXT MEANING', pt: 'Select the TEXT MEANING' })}
            </p>
            <div
              className="text-5xl md:text-6xl font-bold"
              style={{ color: currentQuestion.textColor }}
            >
              {currentQuestion.text}
            </div>
          </>
        ) : (
          <div className="text-[var(--color-text-muted)]">
            <div className="text-6xl mb-4">🎨</div>
            <p>{t({ en: 'Press Start to begin', pt: 'Press Start to begin' })}</p>
          </div>
        )}
      </div>

      {/* Options */}
      {isPlaying && (
        <div className="grid grid-cols-3 gap-3 w-full mb-6">
          {options.map((color) => (
            <button
              key={color.value}
              onClick={() => handleAnswer(color.value)}
              className="p-4 rounded-xl font-bold text-white transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: color.value }}
            >
              {color.name[lang as keyof typeof color.name] || color.name.en}
            </button>
          ))}
        </div>
      )}

      {/* Start/Result */}
      {!isPlaying && (
        <>
          {timeLeft === 0 && (
            <div className="mb-6 p-6 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-xl border border-primary-500 text-center">
              <div className="text-2xl font-bold mb-2">
                {t({ en: 'Game Over!', pt: 'Game Over!' })}
              </div>
              <div className="text-4xl font-bold text-primary-500">{score}</div>
              <div className="text-sm text-[var(--color-text-muted)]">
                {t({ en: 'points', pt: 'points' })}
              </div>
            </div>
          )}
          <button
            onClick={startGame}
            className="px-8 py-4 bg-primary-500 text-white text-xl font-bold rounded-full hover:bg-primary-600 transition-colors"
          >
            {t({ en: 'Start', pt: 'Start' })}
          </button>
        </>
      )}

      {/* Instructions */}
      <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
        <p>
          {mode === 'text-color'
            ? t({ en: 'Quickly select the color the text is displayed in', pt: 'Quickly select the color the text is displayed in' })
            : t({ en: 'Quickly select the color the text describes', pt: 'Quickly select the color the text describes' })}
        </p>
      </div>
    </div>
  );
}
