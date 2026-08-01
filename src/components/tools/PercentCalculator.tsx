'use client';

import { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

type CalculationType = 'whatPercent' | 'percentOf' | 'percentChange' | 'addPercent' | 'subtractPercent';

export default function PercentCalculator({ lang: initialLang }: { lang?: Language } = {}) {
  const { t } = useTranslation(initialLang);
  const [calcType, setCalcType] = useState<CalculationType>('whatPercent');
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const calculate = () => {
    const num1 = parseFloat(value1);
    const num2 = parseFloat(value2);

    if (isNaN(num1) || isNaN(num2)) {
      setResult(null);
      return;
    }

    let res: number;
    switch (calcType) {
      case 'whatPercent':
        res = (num1 / num2) * 100;
        setResult(`${num1} is ${res.toFixed(2)}% of ${num2}`);
        break;
      case 'percentOf':
        res = (num1 / 100) * num2;
        setResult(`${num1}% of ${num2} is ${res.toFixed(2)}`);
        break;
      case 'percentChange':
        res = ((num2 - num1) / num1) * 100;
        setResult(`The change from ${num1} to ${num2} is ${res >= 0 ? '+' : ''}${res.toFixed(2)}%`);
        break;
      case 'addPercent':
        res = num1 * (1 + num2 / 100);
        setResult(`${num1} plus ${num2}% is ${res.toFixed(2)}`);
        break;
      case 'subtractPercent':
        res = num1 * (1 - num2 / 100);
        setResult(`${num1} minus ${num2}% is ${res.toFixed(2)}`);
        break;
    }
  };

  const calculationTypes = [
    { id: 'whatPercent', label: 'A is what % of B?' },
    { id: 'percentOf', label: 'What is A% of B?' },
    { id: 'percentChange', label: 'Percent change from A to B' },
    { id: 'addPercent', label: 'Add B% to A' },
    { id: 'subtractPercent', label: 'Subtract B% from A' },
  ];

  const getLabels = () => {
    switch (calcType) {
      case 'whatPercent':
        return { label1: 'Value A', label2: 'Base value B' };
      case 'percentOf':
        return { label1: 'Percent A (%)', label2: 'Base value B' };
      case 'percentChange':
        return { label1: 'Previous value A', label2: 'Current value B' };
      case 'addPercent':
        return { label1: 'Base value A', label2: 'Percent to add B (%)' };
      case 'subtractPercent':
        return { label1: 'Base value A', label2: 'Percent to subtract B (%)' };
    }
  };

  const labels = getLabels();

  return (
    <div className="flex flex-col gap-6">
      {/* Calculation Type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text)]">
          Calculation type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {calculationTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setCalcType(type.id as CalculationType);
                setResult(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${calcType === type.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] text-[var(--color-text)] border border-[var(--color-border)]'
                }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            {labels.label1}
          </label>
          <input
            type="number"
            value={value1}
            onChange={(e) => setValue1(e.target.value)}
            placeholder="Enter a number"
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)]
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            {labels.label2}
          </label>
          <input
            type="number"
            value={value2}
            onChange={(e) => setValue2(e.target.value)}
            placeholder="Enter a number"
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)]
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Calculate Button */}
      <button
        onClick={calculate}
        className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg
          font-medium transition-colors"
      >
        Calculate
      </button>

      {/* Result */}
      {result && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="text-lg font-medium text-[var(--color-text)] text-center">
            {result}
          </p>
        </div>
      )}

      {/* Quick Reference */}
      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <h3 className="font-medium text-[var(--color-text)] mb-2">Quick reference</h3>
        <div className="grid grid-cols-4 gap-2 text-sm text-[var(--color-text-muted)]">
          {[10, 15, 20, 25, 30, 50, 75, 100].map((p) => (
            <button
              key={p}
              onClick={() => {
                if (calcType === 'whatPercent' || calcType === 'percentChange') return;
                setValue1(value1 || '100');
                setValue2(String(p));
              }}
              className="px-2 py-1 rounded bg-[var(--color-bg)] hover:bg-[var(--color-card-hover)]
                transition-colors"
            >
              {p}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
