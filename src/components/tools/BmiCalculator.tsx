'use client';

import { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

interface BmiResult {
  bmi: number;
  categoryKey: string;
  color: string;
  descriptionKey: string;
  idealWeightMin: number;
  idealWeightMax: number;
}

export default function BmiCalculator({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tc = translations.tools.bmi;

  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [result, setResult] = useState<BmiResult | null>(null);

  const calculateBMI = () => {
    const h = parseFloat(height) / 100; // cm to m
    const w = parseFloat(weight);

    if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) {
      setResult(null);
      return;
    }

    const bmi = w / (h * h);
    const idealWeightMin = 18.5 * h * h;
    const idealWeightMax = 24.9 * h * h;

    let categoryKey: string;
    let color: string;
    let descriptionKey: string;

    if (bmi < 18.5) {
      categoryKey = 'underweight';
      color = 'text-blue-500';
      descriptionKey = 'underweightDesc';
    } else if (bmi < 23) {
      categoryKey = 'normal';
      color = 'text-green-500';
      descriptionKey = 'normalDesc';
    } else if (bmi < 25) {
      categoryKey = 'overweight';
      color = 'text-yellow-500';
      descriptionKey = 'overweightDesc';
    } else if (bmi < 30) {
      categoryKey = 'obese1';
      color = 'text-orange-500';
      descriptionKey = 'obese1Desc';
    } else if (bmi < 35) {
      categoryKey = 'obese2';
      color = 'text-red-500';
      descriptionKey = 'obese2Desc';
    } else {
      categoryKey = 'extremelyObese';
      color = 'text-red-700';
      descriptionKey = 'extremelyObeseDesc';
    }

    setResult({
      bmi,
      categoryKey,
      color,
      descriptionKey,
      idealWeightMin,
      idealWeightMax,
    });
  };

  const getCategoryText = (key: string) => {
    const categoryMap: Record<string, { en: string }> = {
      underweight: tc.underweight,
      normal: tc.normal,
      overweight: tc.overweight,
      obese1: tc.obese1,
      obese2: tc.obese2,
      extremelyObese: tc.extremelyObese,
    };
    return t(categoryMap[key] || tc.normal);
  };

  const getDescriptionText = (key: string) => {
    const descMap: Record<string, { en: string }> = {
      underweightDesc: tc.underweightDesc,
      normalDesc: tc.normalDesc,
      overweightDesc: tc.overweightDesc,
      obese1Desc: tc.obese1Desc,
      obese2Desc: tc.obese2Desc,
      extremelyObeseDesc: tc.extremelyObeseDesc,
    };
    return t(descMap[key] || tc.normalDesc);
  };

  const bmiRanges = [
    { range: `18.5 ${t(tc.lessThan)}`, categoryKey: 'underweight', color: 'bg-blue-500' },
    { range: '18.5 - 22.9', categoryKey: 'normal', color: 'bg-green-500' },
    { range: '23 - 24.9', categoryKey: 'overweight', color: 'bg-yellow-500' },
    { range: '25 - 29.9', categoryKey: 'obese1', color: 'bg-orange-500' },
    { range: '30 - 34.9', categoryKey: 'obese2', color: 'bg-red-500' },
    { range: `35 ${t(tc.orMore)}`, categoryKey: 'extremelyObese', color: 'bg-red-700' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Input Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            {t(tc.height)}
          </label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="170"
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)] text-lg
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            {t(tc.weight)}
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="70"
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)] text-lg
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Calculate Button */}
      <button
        onClick={calculateBMI}
        className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg
          font-medium transition-colors"
      >
        {t(tc.calculate)}
      </button>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* BMI Value */}
          <div className="text-center p-6 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-text-muted)] mb-2">{t(tc.myBmi)}</p>
            <p className={`text-5xl font-bold ${result.color}`}>
              {result.bmi.toFixed(1)}
            </p>
            <p className={`text-xl font-medium mt-2 ${result.color}`}>
              {getCategoryText(result.categoryKey)}
            </p>
          </div>

          {/* Description */}
          <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
            <p className="text-[var(--color-text)]">{getDescriptionText(result.descriptionKey)}</p>
          </div>

          {/* Ideal Weight */}
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-[var(--color-text-muted)] mb-1">{t(tc.idealWeight)}</p>
            <p className="text-lg font-medium text-green-500">
              {result.idealWeightMin.toFixed(1)}kg ~ {result.idealWeightMax.toFixed(1)}kg
            </p>
          </div>

          {/* BMI Scale */}
          <div className="relative h-8 rounded-full overflow-hidden bg-[var(--color-border)]">
            <div className="absolute inset-0 flex">
              {bmiRanges.map((range, i) => (
                <div key={i} className={`flex-1 ${range.color}`} />
              ))}
            </div>
            {/* Marker */}
            <div
              className="absolute top-0 w-1 h-full bg-white shadow-lg transition-all duration-300"
              style={{
                left: `${Math.min(Math.max((result.bmi / 40) * 100, 0), 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* BMI Table */}
      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <h3 className="font-medium text-[var(--color-text)] mb-3">📊 {t(tc.bmiTable)}</h3>
        <div className="space-y-2">
          {bmiRanges.map((range, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded ${range.color}`} />
              <span className="text-sm text-[var(--color-text-muted)] w-24">{range.range}</span>
              <span className="text-sm text-[var(--color-text)]">{getCategoryText(range.categoryKey)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-[var(--color-text-muted)] text-center">
        * {t(tc.disclaimer)}
      </p>
    </div>
  );
}
