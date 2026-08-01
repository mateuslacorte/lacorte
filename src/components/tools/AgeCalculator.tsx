'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

interface AgeResult {
  internationalAge: number;
  months: number;
  days: number;
  totalDays: number;
  nextBirthday: number;
  zodiacKey: string;
  zodiacEmoji: string;
  chineseZodiacKey: string;
  chineseZodiacEmoji: string;
}

export default function AgeCalculator({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tc = translations.tools.age;

  const [birthDate, setBirthDate] = useState('');
  const [result, setResult] = useState<AgeResult | null>(null);

  const getZodiac = (month: number, day: number): { key: string; emoji: string } => {
    const zodiacSigns = [
      { key: 'capricorn', emoji: '♑', start: [12, 22], end: [1, 19] },
      { key: 'aquarius', emoji: '♒', start: [1, 20], end: [2, 18] },
      { key: 'pisces', emoji: '♓', start: [2, 19], end: [3, 20] },
      { key: 'aries', emoji: '♈', start: [3, 21], end: [4, 19] },
      { key: 'taurus', emoji: '♉', start: [4, 20], end: [5, 20] },
      { key: 'gemini', emoji: '♊', start: [5, 21], end: [6, 21] },
      { key: 'cancer', emoji: '♋', start: [6, 22], end: [7, 22] },
      { key: 'leo', emoji: '♌', start: [7, 23], end: [8, 22] },
      { key: 'virgo', emoji: '♍', start: [8, 23], end: [9, 22] },
      { key: 'libra', emoji: '♎', start: [9, 23], end: [10, 22] },
      { key: 'scorpio', emoji: '♏', start: [10, 23], end: [11, 21] },
      { key: 'sagittarius', emoji: '♐', start: [11, 22], end: [12, 21] },
    ];

    for (const z of zodiacSigns) {
      const [sm, sd] = z.start;
      const [em, ed] = z.end;

      if (sm > em) {
        if ((month === sm && day >= sd) || (month === em && day <= ed)) {
          return { key: z.key, emoji: z.emoji };
        }
      } else {
        if ((month === sm && day >= sd) || (month === em && day <= ed) || (month > sm && month < em)) {
          return { key: z.key, emoji: z.emoji };
        }
      }
    }
    return { key: 'capricorn', emoji: '♑' };
  };

  const getChineseZodiac = (year: number): { key: string; emoji: string } => {
    const animals = [
      { key: 'monkey', emoji: '🐵' },
      { key: 'rooster', emoji: '🐔' },
      { key: 'dog', emoji: '🐕' },
      { key: 'pig', emoji: '🐷' },
      { key: 'rat', emoji: '🐭' },
      { key: 'ox', emoji: '🐮' },
      { key: 'tiger', emoji: '🐯' },
      { key: 'rabbit', emoji: '🐰' },
      { key: 'dragon', emoji: '🐲' },
      { key: 'snake', emoji: '🐍' },
      { key: 'horse', emoji: '🐴' },
      { key: 'sheep', emoji: '🐑' },
    ];
    return animals[year % 12];
  };

  useEffect(() => {
    if (!birthDate) {
      setResult(null);
      return;
    }

    const birth = new Date(birthDate);
    const today = new Date();

    // International age
    let internationalAge = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      internationalAge--;
    }

    // Months and days
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      months += 12;
    }
    months = months % 12;

    // Total days lived
    const totalDays = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));

    // Days until next birthday
    const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBirthday <= today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    const daysUntilBirthday = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const zodiac = getZodiac(birth.getMonth() + 1, birth.getDate());
    const chineseZodiac = getChineseZodiac(birth.getFullYear());

    setResult({
      internationalAge,
      months,
      days,
      totalDays,
      nextBirthday: daysUntilBirthday,
      zodiacKey: zodiac.key,
      zodiacEmoji: zodiac.emoji,
      chineseZodiacKey: chineseZodiac.key,
      chineseZodiacEmoji: chineseZodiac.emoji,
    });
  }, [birthDate]);

  const getZodiacName = (key: string) => {
    const zodiacMap: Record<string, { en: string }> = {
      capricorn: tc.capricorn,
      aquarius: tc.aquarius,
      pisces: tc.pisces,
      aries: tc.aries,
      taurus: tc.taurus,
      gemini: tc.gemini,
      cancer: tc.cancer,
      leo: tc.leo,
      virgo: tc.virgo,
      libra: tc.libra,
      scorpio: tc.scorpio,
      sagittarius: tc.sagittarius,
    };
    return t(zodiacMap[key] || tc.capricorn);
  };

  const getChineseZodiacName = (key: string) => {
    const animalMap: Record<string, { en: string }> = {
      monkey: tc.monkey,
      rooster: tc.rooster,
      dog: tc.dog,
      pig: tc.pig,
      rat: tc.rat,
      ox: tc.ox,
      tiger: tc.tiger,
      rabbit: tc.rabbit,
      dragon: tc.dragon,
      snake: tc.snake,
      horse: tc.horse,
      sheep: tc.sheep,
    };
    return t(animalMap[key] || tc.rat);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Birth Date Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {t(tc.birthDate)}
        </label>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
            bg-[var(--color-card)] text-[var(--color-text)] text-lg
            focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Main Age Display */}
          <div className="p-4 rounded-lg bg-primary-500/10 border border-primary-500/20 text-center">
            <p className="text-sm text-[var(--color-text-muted)] mb-1">{t(tc.internationalAge)}</p>
            <p className="text-4xl font-bold text-primary-500">{result.internationalAge}{t(tc.years)}</p>
          </div>

          {/* Detailed Age */}
          <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
            <p className="text-[var(--color-text)]">
              {t(tc.exactAge)}: <span className="font-bold">{result.internationalAge}{t(tc.yearsMonthsDays)} {result.months}{t(tc.monthsUnit)} {result.days}{t(tc.daysUnit)}</span>
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-text-muted)] mb-1">{t(tc.daysLived)}</p>
              <p className="text-2xl font-bold text-[var(--color-text)]">
                {result.totalDays.toLocaleString()}{t(tc.daysUnit)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-text-muted)] mb-1">{t(tc.untilBirthday)}</p>
              <p className="text-2xl font-bold text-[var(--color-text)]">
                {result.nextBirthday === 0 ? `🎂 ${t(tc.todayBirthday)}` : `${result.nextBirthday}${t(tc.daysUnit)}`}
              </p>
            </div>
          </div>

          {/* Zodiac Signs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] text-center">
              <p className="text-3xl mb-2">{result.zodiacEmoji}</p>
              <p className="text-sm text-[var(--color-text-muted)]">{t(tc.zodiac)}</p>
              <p className="font-medium text-[var(--color-text)]">{getZodiacName(result.zodiacKey)}</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] text-center">
              <p className="text-3xl mb-2">{result.chineseZodiacEmoji}</p>
              <p className="text-sm text-[var(--color-text-muted)]">{t(tc.chineseZodiac)}</p>
              <p className="font-medium text-[var(--color-text)]">{getChineseZodiacName(result.chineseZodiacKey)}</p>
            </div>
          </div>

          {/* Fun Facts */}
          <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
            <h3 className="font-medium text-[var(--color-text)] mb-3">📊 {t(tc.funStats)}</h3>
            <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <p>• ~{Math.floor(result.totalDays * 24).toLocaleString()} {t(tc.hoursLived)}</p>
              <p>• ~{Math.floor(result.totalDays * 24 * 60).toLocaleString()} {t(tc.minutesPassed)}</p>
              <p>• ~{(result.totalDays / 7).toFixed(0)} {t(tc.weeksSpent)}</p>
              <p>• ~{(result.totalDays * 24 * 60 * 72).toLocaleString()} {t(tc.heartbeats)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
