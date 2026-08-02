'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

interface ColorStop {
  color: string;
  position: number;
}

type GradientType = 'linear' | 'radial' | 'conic';

const PRESETS = [
  { name: 'Sunset', colors: ['#ff6b6b', '#feca57'] },
  { name: 'Ocean', colors: ['#667eea', '#764ba2'] },
  { name: 'Forest', colors: ['#11998e', '#38ef7d'] },
  { name: 'Fire', colors: ['#f12711', '#f5af19'] },
  { name: 'Sky', colors: ['#2193b0', '#6dd5ed'] },
  { name: 'Berry', colors: ['#8e2de2', '#4a00e0'] },
  { name: 'Peach', colors: ['#ed4264', '#ffedbc'] },
  { name: 'Mint', colors: ['#00b09b', '#96c93d'] },
];

export default function GradientGenerator({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tc = translations.tools.gradient;
  const common = translations.tools.common;

  const [gradientType, setGradientType] = useState<GradientType>('linear');
  const [angle, setAngle] = useState(90);
  const [colorStops, setColorStops] = useState<ColorStop[]>([
    { color: '#667eea', position: 0 },
    { color: '#764ba2', position: 100 },
  ]);
  const [copied, setCopied] = useState(false);

  const cssGradient = useMemo(() => {
    const stopsStr = colorStops
      .sort((a, b) => a.position - b.position)
      .map((stop) => `${stop.color} ${stop.position}%`)
      .join(', ');

    switch (gradientType) {
      case 'linear':
        return `linear-gradient(${angle}deg, ${stopsStr})`;
      case 'radial':
        return `radial-gradient(circle, ${stopsStr})`;
      case 'conic':
        return `conic-gradient(from ${angle}deg, ${stopsStr})`;
      default:
        return '';
    }
  }, [gradientType, angle, colorStops]);

  const fullCss = `background: ${cssGradient};`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullCss);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const addColorStop = () => {
    if (colorStops.length >= 10) return;
    const newPosition = colorStops.length > 0
      ? Math.round(colorStops.reduce((sum, stop) => sum + stop.position, 0) / colorStops.length)
      : 50;
    setColorStops([...colorStops, { color: '#ffffff', position: newPosition }]);
  };

  const removeColorStop = (index: number) => {
    if (colorStops.length <= 2) return;
    setColorStops(colorStops.filter((_, i) => i !== index));
  };

  const updateColorStop = (index: number, updates: Partial<ColorStop>) => {
    setColorStops(colorStops.map((stop, i) =>
      i === index ? { ...stop, ...updates } : stop
    ));
  };

  const applyPreset = (colors: string[]) => {
    const newStops = colors.map((color, index) => ({
      color,
      position: Math.round((index / (colors.length - 1)) * 100),
    }));
    setColorStops(newStops);
  };

  const randomGradient = () => {
    const randomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    setColorStops([
      { color: randomColor(), position: 0 },
      { color: randomColor(), position: 100 },
    ]);
    setAngle(Math.floor(Math.random() * 360));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Preview */}
      <div
        className="w-full h-48 rounded-xl shadow-lg"
        style={{ background: cssGradient }}
      />

      {/* Type Selection */}
      <div className="flex rounded-lg overflow-hidden border border-[var(--color-border)]">
        {(['linear', 'radial', 'conic'] as GradientType[]).map((type) => (
          <button
            key={type}
            onClick={() => setGradientType(type)}
            className={`flex-1 py-2 font-medium transition-colors capitalize
              ${gradientType === type
                ? 'bg-primary-500 text-white'
                : 'bg-[var(--color-card)] text-[var(--color-text)] hover:bg-[var(--color-card-hover)]'
              }`}
          >
            {type === 'linear' ? t(tc.typeLinear) : type === 'radial' ? t(tc.typeRadial) : t(tc.typeConic)}
          </button>
        ))}
      </div>

      {/* Angle (for linear and conic) */}
      {(gradientType === 'linear' || gradientType === 'conic') && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-[var(--color-text)]">
              {t(tc.angle)}
            </label>
            <span className="text-sm text-[var(--color-text-muted)]">{angle}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="w-full accent-primary-500"
          />
        </div>
      )}

      {/* Color Stops */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-[var(--color-text)]">
            {t(tc.colorStops)}
          </label>
          <button
            onClick={addColorStop}
            disabled={colorStops.length >= 10}
            className="px-3 py-1 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded
              transition-colors disabled:opacity-50"
          >
            + {t(tc.add)}
          </button>
        </div>

        {colorStops.map((stop, index) => (
          <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
            <input
              type="color"
              value={stop.color}
              onChange={(e) => updateColorStop(index, { color: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={stop.color}
              onChange={(e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  updateColorStop(index, { color: e.target.value });
                }
              }}
              className="w-24 px-2 py-1 rounded border border-[var(--color-border)]
                bg-[var(--color-bg)] text-[var(--color-text)] font-mono text-sm"
            />
            <input
              type="range"
              min="0"
              max="100"
              value={stop.position}
              onChange={(e) => updateColorStop(index, { position: Number(e.target.value) })}
              className="flex-1 accent-primary-500"
            />
            <span className="w-12 text-sm text-[var(--color-text-muted)]">{stop.position}%</span>
            <button
              onClick={() => removeColorStop(index)}
              disabled={colorStops.length <= 2}
              className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded
                transition-colors disabled:opacity-30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text)]">
          {t(tc.presets)}
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.colors)}
              className="w-12 h-8 rounded-lg shadow-sm hover:scale-110 transition-transform"
              style={{
                background: `linear-gradient(90deg, ${preset.colors.join(', ')})`,
              }}
              title={preset.name}
            />
          ))}
          <button
            onClick={randomGradient}
            className="px-3 h-8 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]
              hover:bg-[var(--color-card-hover)] transition-colors text-sm"
          >
            🎲 {t(tc.random)}
          </button>
        </div>
      </div>

      {/* CSS Output */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-[var(--color-text)]">CSS</label>
          <button
            onClick={copyToClipboard}
            className="px-3 py-1 text-sm bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
              border border-[var(--color-border)] rounded transition-colors"
          >
            {copied ? t(common.copied) : t(common.copy)}
          </button>
        </div>
        <div className="p-4 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
          <code className="text-sm font-mono text-[var(--color-text)] break-all">
            {fullCss}
          </code>
        </div>
      </div>
    </div>
  );
}
