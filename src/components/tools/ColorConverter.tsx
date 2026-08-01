'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

// Color conversion utilities
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

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

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
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

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export default function ColorConverter({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tt = translations.tools.color;
  const tc = translations.tools.common;

  const [hex, setHex] = useState('#3b82f6');
  const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
  const [hsl, setHsl] = useState({ h: 217, s: 91, l: 60 });
  const [copied, setCopied] = useState<string | null>(null);

  const updateFromHex = useCallback((hexValue: string) => {
    const rgbValue = hexToRgb(hexValue);
    if (rgbValue) {
      setRgb(rgbValue);
      setHsl(rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b));
    }
  }, []);

  const updateFromRgb = useCallback((r: number, g: number, b: number) => {
    setHex(rgbToHex(r, g, b));
    setHsl(rgbToHsl(r, g, b));
  }, []);

  const updateFromHsl = useCallback((h: number, s: number, l: number) => {
    const rgbValue = hslToRgb(h, s, l);
    setRgb(rgbValue);
    setHex(rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b));
  }, []);

  const copyToClipboard = async (text: string, format: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(format);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleHexChange = (value: string) => {
    setHex(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      updateFromHex(value);
    }
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...rgb, [channel]: Math.max(0, Math.min(255, value)) };
    setRgb(newRgb);
    updateFromRgb(newRgb.r, newRgb.g, newRgb.b);
  };

  const handleHslChange = (channel: 'h' | 's' | 'l', value: number) => {
    const max = channel === 'h' ? 360 : 100;
    const newHsl = { ...hsl, [channel]: Math.max(0, Math.min(max, value)) };
    setHsl(newHsl);
    updateFromHsl(newHsl.h, newHsl.s, newHsl.l);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Color Preview */}
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-32 h-32 rounded-2xl shadow-lg border-4 border-white dark:border-gray-700"
          style={{ backgroundColor: hex }}
        />
        <input
          type="color"
          value={hex}
          onChange={(e) => {
            setHex(e.target.value);
            updateFromHex(e.target.value);
          }}
          className="w-16 h-10 cursor-pointer rounded border-0"
        />
      </div>

      {/* HEX Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {t(tt.hex)}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={hex}
            onChange={(e) => handleHexChange(e.target.value)}
            placeholder="#000000"
            className="flex-1 px-4 py-2 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)] font-mono
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={() => copyToClipboard(hex, 'hex')}
            className="px-4 py-2 bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
              border border-[var(--color-border)] rounded-lg transition-colors text-sm"
          >
            {copied === 'hex' ? t(tc.copied) : t(tc.copy)}
          </button>
        </div>
      </div>

      {/* RGB Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {t(tt.rgb)}
        </label>
        <div className="flex gap-2 items-center">
          <div className="flex-1 grid grid-cols-3 gap-2">
            {(['r', 'g', 'b'] as const).map((channel) => (
              <div key={channel} className="space-y-1">
                <label className="text-xs text-[var(--color-text-muted)] uppercase">{channel}</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb[channel]}
                  onChange={(e) => handleRgbChange(channel, Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)]
                    bg-[var(--color-card)] text-[var(--color-text)] text-center
                    focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'rgb')}
            className="px-4 py-2 bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
              border border-[var(--color-border)] rounded-lg transition-colors text-sm self-end"
          >
            {copied === 'rgb' ? t(tc.copied) : t(tc.copy)}
          </button>
        </div>
      </div>

      {/* HSL Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {t(tt.hsl)}
        </label>
        <div className="flex gap-2 items-center">
          <div className="flex-1 grid grid-cols-3 gap-2">
            {[
              { key: 'h' as const, label: 'H', max: 360 },
              { key: 's' as const, label: 'S', max: 100 },
              { key: 'l' as const, label: 'L', max: 100 },
            ].map(({ key, label, max }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs text-[var(--color-text-muted)]">{label}</label>
                <input
                  type="number"
                  min="0"
                  max={max}
                  value={hsl[key]}
                  onChange={(e) => handleHslChange(key, Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)]
                    bg-[var(--color-card)] text-[var(--color-text)] text-center
                    focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'hsl')}
            className="px-4 py-2 bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
              border border-[var(--color-border)] rounded-lg transition-colors text-sm self-end"
          >
            {copied === 'hsl' ? t(tc.copied) : t(tc.copy)}
          </button>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-[var(--color-text-muted)]">Hue</label>
          <input
            type="range"
            min="0"
            max="360"
            value={hsl.h}
            onChange={(e) => handleHslChange('h', Number(e.target.value))}
            className="w-full h-3 rounded-full appearance-none cursor-pointer"
            style={{
              background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
            }}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-[var(--color-text-muted)]">Saturation</label>
          <input
            type="range"
            min="0"
            max="100"
            value={hsl.s}
            onChange={(e) => handleHslChange('s', Number(e.target.value))}
            className="w-full accent-primary-500"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-[var(--color-text-muted)]">Lightness</label>
          <input
            type="range"
            min="0"
            max="100"
            value={hsl.l}
            onChange={(e) => handleHslChange('l', Number(e.target.value))}
            className="w-full accent-primary-500"
          />
        </div>
      </div>
    </div>
  );
}
