'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

interface Shadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
  inset: boolean;
}

const PRESETS = [
  { name: 'Subtle', shadow: { offsetX: 0, offsetY: 1, blur: 3, spread: 0, color: 'rgba(0,0,0,0.12)', inset: false } },
  { name: 'Regular', shadow: { offsetX: 0, offsetY: 4, blur: 6, spread: -1, color: 'rgba(0,0,0,0.1)', inset: false } },
  { name: 'Medium', shadow: { offsetX: 0, offsetY: 10, blur: 15, spread: -3, color: 'rgba(0,0,0,0.1)', inset: false } },
  { name: 'Large', shadow: { offsetX: 0, offsetY: 20, blur: 25, spread: -5, color: 'rgba(0,0,0,0.1)', inset: false } },
  { name: 'Sharp', shadow: { offsetX: 4, offsetY: 4, blur: 0, spread: 0, color: 'rgba(0,0,0,0.25)', inset: false } },
  { name: 'Inset', shadow: { offsetX: 0, offsetY: 2, blur: 4, spread: 0, color: 'rgba(0,0,0,0.06)', inset: true } },
  { name: 'Glow', shadow: { offsetX: 0, offsetY: 0, blur: 20, spread: 0, color: 'rgba(59,130,246,0.5)', inset: false } },
  { name: 'Layered', shadow: { offsetX: 0, offsetY: 4, blur: 6, spread: 0, color: 'rgba(0,0,0,0.07)', inset: false } },
];

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function BoxShadowGenerator({ lang: initialLang }: { lang?: Language } = {}) {
  const { t } = useTranslation(initialLang);

  const [shadows, setShadows] = useState<Shadow[]>([
    { offsetX: 0, offsetY: 4, blur: 6, spread: -1, color: '#000000', inset: false },
  ]);
  const [opacity, setOpacity] = useState(10);
  const [boxColor, setBoxColor] = useState('#ffffff');
  const [borderRadius, setBorderRadius] = useState(8);
  const [copied, setCopied] = useState(false);

  const cssValue = useMemo(() => {
    return shadows
      .map((shadow) => {
        const colorWithOpacity = hexToRgba(shadow.color, opacity / 100);
        const insetStr = shadow.inset ? 'inset ' : '';
        return `${insetStr}${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.spread}px ${colorWithOpacity}`;
      })
      .join(', ');
  }, [shadows, opacity]);

  const fullCss = `box-shadow: ${cssValue};`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullCss);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const addShadow = () => {
    if (shadows.length >= 5) return;
    setShadows([...shadows, { offsetX: 0, offsetY: 10, blur: 15, spread: -3, color: '#000000', inset: false }]);
  };

  const removeShadow = (index: number) => {
    if (shadows.length <= 1) return;
    setShadows(shadows.filter((_, i) => i !== index));
  };

  const updateShadow = (index: number, updates: Partial<Shadow>) => {
    setShadows(shadows.map((shadow, i) =>
      i === index ? { ...shadow, ...updates } : shadow
    ));
  };

  const applyPreset = (preset: Shadow) => {
    setShadows([preset]);
    if (preset.color.startsWith('rgba')) {
      // Extract opacity from rgba
      const match = preset.color.match(/[\d.]+\)$/);
      if (match) {
        setOpacity(Math.round(parseFloat(match[0]) * 100));
      }
      setShadows([{ ...preset, color: '#000000' }]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Preview */}
      <div className="flex items-center justify-center p-12 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <div
          className="w-48 h-32 flex items-center justify-center text-gray-500"
          style={{
            backgroundColor: boxColor,
            boxShadow: cssValue,
            borderRadius: `${borderRadius}px`,
          }}
        >
          Preview
        </div>
      </div>

      {/* Box Settings */}
      <div className="flex flex-wrap gap-4 items-center p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text)]">
            {t({ en: 'Box Color', pt: 'Box Color' })}:
          </label>
          <input
            type="color"
            value={boxColor}
            onChange={(e) => setBoxColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text)]">
            {t({ en: 'Radius', pt: 'Radius' })}:
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={borderRadius}
            onChange={(e) => setBorderRadius(Number(e.target.value))}
            className="w-16 px-2 py-1 rounded border border-[var(--color-border)]
              bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
          <span className="text-sm text-[var(--color-text-muted)]">px</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text)]">
            {t({ en: 'Opacity', pt: 'Opacity' })}:
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-24 accent-primary-500"
          />
          <span className="text-sm text-[var(--color-text-muted)] w-10">{opacity}%</span>
        </div>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text)]">
          {t({ en: 'Presets', pt: 'Presets' })}
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.shadow)}
              className="px-3 py-1.5 text-sm bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
                border border-[var(--color-border)] rounded-lg transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Shadow Controls */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-[var(--color-text)]">
            {t({ en: 'Shadow Layers', pt: 'Shadow Layers' })}
          </label>
          <button
            onClick={addShadow}
            disabled={shadows.length >= 5}
            className="px-3 py-1 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded
              transition-colors disabled:opacity-50"
          >
            + {t({ en: 'Add', pt: 'Add' })}
          </button>
        </div>

        {shadows.map((shadow, index) => (
          <div key={index} className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-[var(--color-text)]">
                {t({ en: 'Layer', pt: 'Layer' })} {index + 1}
              </span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shadow.inset}
                    onChange={(e) => updateShadow(index, { inset: e.target.checked })}
                    className="w-4 h-4 rounded text-primary-500"
                  />
                  <span className="text-xs text-[var(--color-text-muted)]">inset</span>
                </label>
                <button
                  onClick={() => removeShadow(index)}
                  disabled={shadows.length <= 1}
                  className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded
                    transition-colors disabled:opacity-30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'offsetX', label: 'X', min: -50, max: 50 },
                { key: 'offsetY', label: 'Y', min: -50, max: 50 },
                { key: 'blur', label: t({ en: 'Blur', pt: 'Blur' }), min: 0, max: 100 },
                { key: 'spread', label: t({ en: 'Spread', pt: 'Spread' }), min: -50, max: 50 },
              ].map(({ key, label, min, max }) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs text-[var(--color-text-muted)]">{label}</label>
                  <div className="flex gap-1">
                    <input
                      type="range"
                      min={min}
                      max={max}
                      value={shadow[key as keyof Shadow] as number}
                      onChange={(e) => updateShadow(index, { [key]: Number(e.target.value) })}
                      className="flex-1 accent-primary-500"
                    />
                    <input
                      type="number"
                      min={min}
                      max={max}
                      value={shadow[key as keyof Shadow] as number}
                      onChange={(e) => updateShadow(index, { [key]: Number(e.target.value) })}
                      className="w-14 px-1 py-0.5 text-xs text-center rounded border border-[var(--color-border)]
                        bg-[var(--color-bg)] text-[var(--color-text)]"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--color-text-muted)]">
                {t({ en: 'Color', pt: 'Color' })}:
              </label>
              <input
                type="color"
                value={shadow.color}
                onChange={(e) => updateShadow(index, { color: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={shadow.color}
                onChange={(e) => {
                  if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    updateShadow(index, { color: e.target.value });
                  }
                }}
                className="w-20 px-2 py-1 text-xs rounded border border-[var(--color-border)]
                  bg-[var(--color-bg)] text-[var(--color-text)] font-mono"
              />
            </div>
          </div>
        ))}
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
            {copied ? t({ en: 'Copied!', pt: 'Copied!' }) : t({ en: 'Copy', pt: 'Copy' })}
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
