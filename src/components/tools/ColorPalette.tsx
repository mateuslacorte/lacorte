'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

type HarmonyType = 'complementary' | 'triadic' | 'analogous' | 'splitComplementary' | 'tetradic' | 'monochromatic';

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface Color {
  hex: string;
  hsl: HSL;
}

function hexToHsl(hex: string): HSL {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function generatePalette(baseHex: string, harmony: HarmonyType): Color[] {
  const baseHsl = hexToHsl(baseHex);
  const colors: Color[] = [];

  const addColor = (h: number, s: number, l: number) => {
    h = ((h % 360) + 360) % 360; // Normalize hue
    s = Math.max(0, Math.min(100, s));
    l = Math.max(0, Math.min(100, l));
    colors.push({
      hex: hslToHex(h, s, l),
      hsl: { h, s, l },
    });
  };

  switch (harmony) {
    case 'complementary':
      addColor(baseHsl.h, baseHsl.s, baseHsl.l);
      addColor(baseHsl.h + 180, baseHsl.s, baseHsl.l);
      break;

    case 'triadic':
      addColor(baseHsl.h, baseHsl.s, baseHsl.l);
      addColor(baseHsl.h + 120, baseHsl.s, baseHsl.l);
      addColor(baseHsl.h + 240, baseHsl.s, baseHsl.l);
      break;

    case 'analogous':
      addColor(baseHsl.h - 30, baseHsl.s, baseHsl.l);
      addColor(baseHsl.h, baseHsl.s, baseHsl.l);
      addColor(baseHsl.h + 30, baseHsl.s, baseHsl.l);
      addColor(baseHsl.h + 60, baseHsl.s, baseHsl.l);
      break;

    case 'splitComplementary':
      addColor(baseHsl.h, baseHsl.s, baseHsl.l);
      addColor(baseHsl.h + 150, baseHsl.s, baseHsl.l);
      addColor(baseHsl.h + 210, baseHsl.s, baseHsl.l);
      break;

    case 'tetradic':
      addColor(baseHsl.h, baseHsl.s, baseHsl.l);
      addColor(baseHsl.h + 90, baseHsl.s, baseHsl.l);
      addColor(baseHsl.h + 180, baseHsl.s, baseHsl.l);
      addColor(baseHsl.h + 270, baseHsl.s, baseHsl.l);
      break;

    case 'monochromatic':
      addColor(baseHsl.h, baseHsl.s, baseHsl.l - 30);
      addColor(baseHsl.h, baseHsl.s, baseHsl.l - 15);
      addColor(baseHsl.h, baseHsl.s, baseHsl.l);
      addColor(baseHsl.h, baseHsl.s, baseHsl.l + 15);
      addColor(baseHsl.h, baseHsl.s, baseHsl.l + 30);
      break;
  }

  return colors;
}

export default function ColorPalette({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tt = translations.tools.colorPalette;
  const tc = translations.tools.common;

  const [baseColor, setBaseColor] = useState('#3b82f6');
  const [harmony, setHarmony] = useState<HarmonyType>('analogous');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const palette = useMemo(() => generatePalette(baseColor, harmony), [baseColor, harmony]);

  const copyColor = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedColor(hex);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyAllColors = async () => {
    try {
      const colors = palette.map((c) => c.hex).join('\n');
      await navigator.clipboard.writeText(colors);
      setCopiedColor('all');
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const randomColor = () => {
    const hex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    setBaseColor(hex);
  };

  const harmonyOptions: { value: HarmonyType; label: Record<Language, string> }[] = [
    { value: 'complementary', label: tt.complementary },
    { value: 'triadic', label: tt.triadic },
    { value: 'analogous', label: tt.analogous },
    { value: 'splitComplementary', label: tt.splitComplementary },
    { value: 'tetradic', label: tt.tetradic },
    { value: 'monochromatic', label: tt.monochromatic },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Base Color Picker */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text)]">{t(tt.baseColor)}:</label>
          <input
            type="color"
            value={baseColor}
            onChange={(e) => setBaseColor(e.target.value)}
            className="w-12 h-10 cursor-pointer rounded border-0"
          />
          <input
            type="text"
            value={baseColor}
            onChange={(e) => {
              if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                setBaseColor(e.target.value);
              }
            }}
            className="w-24 px-2 py-1 rounded border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)] font-mono text-sm"
          />
          <button
            onClick={randomColor}
            className="p-2 rounded-lg bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
              border border-[var(--color-border)] transition-colors"
            title="Random"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Harmony Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text)]">{t(tt.harmony)}</label>
        <div className="flex flex-wrap gap-2">
          {harmonyOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setHarmony(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${harmony === value
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] text-[var(--color-text)] border border-[var(--color-border)]'
                }`}
            >
              {t(label)}
            </button>
          ))}
        </div>
      </div>

      {/* Palette Display */}
      <div className="space-y-4">
        {/* Large Color Swatches */}
        <div className="flex flex-wrap gap-4 justify-center">
          {palette.map((color, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-2"
            >
              <button
                onClick={() => copyColor(color.hex)}
                className="w-24 h-24 md:w-32 md:h-32 rounded-xl shadow-lg transition-transform hover:scale-105
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                style={{ backgroundColor: color.hex }}
                title={`Click to copy ${color.hex}`}
              />
              <code className="text-sm font-mono text-[var(--color-text)]">
                {copiedColor === color.hex ? t(tc.copied) : color.hex}
              </code>
            </div>
          ))}
        </div>

        {/* Copy All Button */}
        <div className="flex justify-center">
          <button
            onClick={copyAllColors}
            className="px-4 py-2 bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
              border border-[var(--color-border)] rounded-lg transition-colors"
          >
            {copiedColor === 'all'
              ? t(tc.copied)
              : t({ en: 'Copy All Colors', pt: 'Copy All Colors' })}
          </button>
        </div>
      </div>

      {/* Color Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {palette.map((color, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]
              flex items-center gap-4"
          >
            <div
              className="w-12 h-12 rounded-lg flex-shrink-0"
              style={{ backgroundColor: color.hex }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-mono text-sm text-[var(--color-text)]">{color.hex}</div>
              <div className="text-xs text-[var(--color-text-muted)]">
                HSL({color.hsl.h}, {color.hsl.s}%, {color.hsl.l}%)
              </div>
            </div>
            <button
              onClick={() => copyColor(color.hex)}
              className="px-2 py-1 text-xs bg-[var(--color-bg)] hover:bg-[var(--color-card-hover)]
                border border-[var(--color-border)] rounded transition-colors"
            >
              {copiedColor === color.hex ? t(tc.copied) : t(tc.copy)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
