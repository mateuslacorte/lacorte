'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

type UnitCategory = 'length' | 'weight' | 'temperature' | 'area' | 'volume';

interface UnitDefinition {
  name: { en: string; pt?: string };
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

const units: Record<UnitCategory, Record<string, UnitDefinition>> = {
  length: {
    mm: {
      name: { en: 'Millimeter (mm)', pt: 'Millimeter (mm)' },
      toBase: (v) => v / 1000,
      fromBase: (v) => v * 1000,
    },
    cm: {
      name: { en: 'Centimeter (cm)', pt: 'Centimeter (cm)' },
      toBase: (v) => v / 100,
      fromBase: (v) => v * 100,
    },
    m: {
      name: { en: 'Meter (m)', pt: 'Meter (m)' },
      toBase: (v) => v,
      fromBase: (v) => v,
    },
    km: {
      name: { en: 'Kilometer (km)', pt: 'Kilometer (km)' },
      toBase: (v) => v * 1000,
      fromBase: (v) => v / 1000,
    },
    inch: {
      name: { en: 'Inch (in)', pt: 'Inch (in)' },
      toBase: (v) => v * 0.0254,
      fromBase: (v) => v / 0.0254,
    },
    ft: {
      name: { en: 'Foot (ft)', pt: 'Foot (ft)' },
      toBase: (v) => v * 0.3048,
      fromBase: (v) => v / 0.3048,
    },
    yard: {
      name: { en: 'Yard (yd)', pt: 'Yard (yd)' },
      toBase: (v) => v * 0.9144,
      fromBase: (v) => v / 0.9144,
    },
    mile: {
      name: { en: 'Mile (mi)', pt: 'Mile (mi)' },
      toBase: (v) => v * 1609.344,
      fromBase: (v) => v / 1609.344,
    },
  },
  weight: {
    mg: {
      name: { en: 'Milligram (mg)', pt: 'Milligram (mg)' },
      toBase: (v) => v / 1000000,
      fromBase: (v) => v * 1000000,
    },
    g: {
      name: { en: 'Gram (g)', pt: 'Gram (g)' },
      toBase: (v) => v / 1000,
      fromBase: (v) => v * 1000,
    },
    kg: {
      name: { en: 'Kilogram (kg)', pt: 'Kilogram (kg)' },
      toBase: (v) => v,
      fromBase: (v) => v,
    },
    ton: {
      name: { en: 'Ton (t)', pt: 'Ton (t)' },
      toBase: (v) => v * 1000,
      fromBase: (v) => v / 1000,
    },
    oz: {
      name: { en: 'Ounce (oz)', pt: 'Ounce (oz)' },
      toBase: (v) => v * 0.0283495,
      fromBase: (v) => v / 0.0283495,
    },
    lb: {
      name: { en: 'Pound (lb)', pt: 'Pound (lb)' },
      toBase: (v) => v * 0.453592,
      fromBase: (v) => v / 0.453592,
    },
  },
  temperature: {
    celsius: {
      name: { en: 'Celsius (°C)', pt: 'Celsius (°C)' },
      toBase: (v) => v,
      fromBase: (v) => v,
    },
    fahrenheit: {
      name: { en: 'Fahrenheit (°F)', pt: 'Fahrenheit (°F)' },
      toBase: (v) => (v - 32) * 5 / 9,
      fromBase: (v) => v * 9 / 5 + 32,
    },
    kelvin: {
      name: { en: 'Kelvin (K)', pt: 'Kelvin (K)' },
      toBase: (v) => v - 273.15,
      fromBase: (v) => v + 273.15,
    },
  },
  area: {
    sqft: {
      name: { en: 'Square foot (ft²)', pt: 'Square foot (ft²)' },
      toBase: (v) => v * 0.092903,
      fromBase: (v) => v / 0.092903,
    },
    acre: {
      name: { en: 'Acre', pt: 'Acre' },
      toBase: (v) => v * 4046.86,
      fromBase: (v) => v / 4046.86,
    },
    sqm: {
      name: { en: 'Square meter (m²)', pt: 'Square meter (m²)' },
      toBase: (v) => v,
      fromBase: (v) => v,
    },
    sqkm: {
      name: { en: 'Square kilometer (km²)', pt: 'Square kilometer (km²)' },
      toBase: (v) => v * 1000000,
      fromBase: (v) => v / 1000000,
    },
    pyeong: {
      name: { en: 'Pyeong (py)', pt: 'Pyeong (py)' },
      toBase: (v) => v * 3.306,
      fromBase: (v) => v / 3.306,
    },
  },
  volume: {
    ml: {
      name: { en: 'Milliliter (mL)', pt: 'Milliliter (mL)' },
      toBase: (v) => v / 1000,
      fromBase: (v) => v * 1000,
    },
    l: {
      name: { en: 'Liter (L)', pt: 'Liter (L)' },
      toBase: (v) => v,
      fromBase: (v) => v,
    },
    gal: {
      name: { en: 'Gallon (gal)', pt: 'Gallon (gal)' },
      toBase: (v) => v * 3.78541,
      fromBase: (v) => v / 3.78541,
    },
    cup: {
      name: { en: 'Cup', pt: 'Cup' },
      toBase: (v) => v * 0.236588,
      fromBase: (v) => v / 0.236588,
    },
  },
};

const categoryLabels: Record<UnitCategory, { en: string; pt?: string }> = {
  length: { en: 'Length', pt: 'Length' },
  weight: { en: 'Weight', pt: 'Weight' },
  temperature: { en: 'Temperature', pt: 'Temperature' },
  area: { en: 'Area', pt: 'Area' },
  volume: { en: 'Volume', pt: 'Volume' },
};

export default function UnitConverter({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, lang, translations } = useTranslation(initialLang);
  const tt = translations.tools.unit;

  const [category, setCategory] = useState<UnitCategory>('length');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('ft');
  const [fromValue, setFromValue] = useState('1');

  const categoryUnits = units[category];

  const result = useMemo(() => {
    const value = parseFloat(fromValue);
    if (isNaN(value)) return '';

    const baseValue = categoryUnits[fromUnit].toBase(value);
    const convertedValue = categoryUnits[toUnit].fromBase(baseValue);

    // Format with appropriate precision
    if (Math.abs(convertedValue) < 0.0001 || Math.abs(convertedValue) >= 1000000) {
      return convertedValue.toExponential(6);
    }
    return convertedValue.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }, [fromValue, fromUnit, toUnit, categoryUnits]);

  const handleCategoryChange = (newCategory: UnitCategory) => {
    setCategory(newCategory);
    const unitKeys = Object.keys(units[newCategory]);
    setFromUnit(unitKeys[0]);
    setToUnit(unitKeys[1] || unitKeys[0]);
    setFromValue('1');
  };

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    if (result) {
      setFromValue(result.replace(/,/g, ''));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(units) as UnitCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${category === cat
                ? 'bg-primary-500 text-white'
                : 'bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] text-[var(--color-text)] border border-[var(--color-border)]'
              }`}
          >
            {t(categoryLabels[cat])}
          </button>
        ))}
      </div>

      {/* Converter */}
      <div className="space-y-4">
        {/* From */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text)]">{t(tt.from)}</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg border border-[var(--color-border)]
                bg-[var(--color-card)] text-[var(--color-text)] text-lg
                focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="px-4 py-2 rounded-lg border border-[var(--color-border)]
                bg-[var(--color-card)] text-[var(--color-text)]
                focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {Object.entries(categoryUnits).map(([key, unit]) => (
                <option key={key} value={key}>
                  {t(unit.name)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={swapUnits}
            className="p-2 rounded-full bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
              border border-[var(--color-border)] transition-colors"
          >
            <svg className="w-6 h-6 text-[var(--color-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* To */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text)]">{t(tt.to)}</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={result}
              readOnly
              className="flex-1 px-4 py-3 rounded-lg border border-[var(--color-border)]
                bg-[var(--color-bg)] text-[var(--color-text)] text-lg font-medium
                focus:outline-none"
            />
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="px-4 py-2 rounded-lg border border-[var(--color-border)]
                bg-[var(--color-card)] text-[var(--color-text)]
                focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {Object.entries(categoryUnits).map(([key, unit]) => (
                <option key={key} value={key}>
                  {t(unit.name)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick conversions */}
      {fromValue && result && (
        <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
          <p className="text-center text-lg">
            <span className="font-medium">{fromValue}</span>{' '}
            <span className="text-[var(--color-text-muted)]">{t(categoryUnits[fromUnit].name)}</span>
            {' = '}
            <span className="font-bold text-primary-500">{result}</span>{' '}
            <span className="text-[var(--color-text-muted)]">{t(categoryUnits[toUnit].name)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
