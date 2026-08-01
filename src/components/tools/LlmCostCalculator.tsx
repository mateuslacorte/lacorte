'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

interface ModelPrice {
  name: string;
  displayName: string;
  provider: string;
  inputCost: number; // per 1K tokens
  outputCost: number; // per 1K tokens
  maxInputTokens: number;
  maxOutputTokens: number;
}

interface Currency {
  code: string;
  symbol: string;
  nameKey: 'currencyUsd' | 'currencyJpy' | 'currencyEur';
  defaultRate: number;
}

const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', nameKey: 'currencyUsd', defaultRate: 1 },
  { code: 'EUR', symbol: '€', nameKey: 'currencyEur', defaultRate: 0.92 },
  { code: 'JPY', symbol: '¥', nameKey: 'currencyJpy', defaultRate: 157 },
];

// Pricing sources for reference
const PRICING_SOURCES = [
  { name: 'OpenAI', url: 'https://openai.com/api/pricing/' },
  { name: 'Anthropic', url: 'https://www.anthropic.com/pricing' },
  { name: 'Google AI', url: 'https://ai.google.dev/pricing' },
  { name: 'AWS Bedrock', url: 'https://aws.amazon.com/bedrock/pricing/' },
  { name: 'Azure OpenAI', url: 'https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/' },
  { name: 'LiteLLM', url: 'https://litellm.vercel.app/docs/providers' },
];

// Prices per 1K tokens (data from official pricing pages)
const MODEL_PRICES: ModelPrice[] = [
  // OpenAI
  { name: 'gpt-4o', displayName: 'GPT-4o', provider: 'OpenAI', inputCost: 0.0025, outputCost: 0.01, maxInputTokens: 128000, maxOutputTokens: 16384 },
  { name: 'gpt-4o-mini', displayName: 'GPT-4o Mini', provider: 'OpenAI', inputCost: 0.00015, outputCost: 0.0006, maxInputTokens: 128000, maxOutputTokens: 16384 },
  { name: 'gpt-4-turbo', displayName: 'GPT-4 Turbo', provider: 'OpenAI', inputCost: 0.01, outputCost: 0.03, maxInputTokens: 128000, maxOutputTokens: 4096 },
  { name: 'gpt-4', displayName: 'GPT-4', provider: 'OpenAI', inputCost: 0.03, outputCost: 0.06, maxInputTokens: 8192, maxOutputTokens: 8192 },
  { name: 'gpt-3.5-turbo', displayName: 'GPT-3.5 Turbo', provider: 'OpenAI', inputCost: 0.0005, outputCost: 0.0015, maxInputTokens: 16385, maxOutputTokens: 4096 },
  { name: 'o1', displayName: 'o1', provider: 'OpenAI', inputCost: 0.015, outputCost: 0.06, maxInputTokens: 200000, maxOutputTokens: 100000 },
  { name: 'o1-mini', displayName: 'o1 Mini', provider: 'OpenAI', inputCost: 0.003, outputCost: 0.012, maxInputTokens: 128000, maxOutputTokens: 65536 },
  { name: 'o3-mini', displayName: 'o3 Mini', provider: 'OpenAI', inputCost: 0.00113, outputCost: 0.00452, maxInputTokens: 200000, maxOutputTokens: 100000 },

  // Anthropic
  { name: 'claude-opus-4-5', displayName: 'Claude Opus 4.5', provider: 'Anthropic', inputCost: 0.015, outputCost: 0.075, maxInputTokens: 200000, maxOutputTokens: 32000 },
  { name: 'claude-sonnet-4', displayName: 'Claude Sonnet 4', provider: 'Anthropic', inputCost: 0.003, outputCost: 0.015, maxInputTokens: 200000, maxOutputTokens: 64000 },
  { name: 'claude-3.5-sonnet', displayName: 'Claude 3.5 Sonnet', provider: 'Anthropic', inputCost: 0.003, outputCost: 0.015, maxInputTokens: 200000, maxOutputTokens: 8192 },
  { name: 'claude-3-opus', displayName: 'Claude 3 Opus', provider: 'Anthropic', inputCost: 0.015, outputCost: 0.075, maxInputTokens: 200000, maxOutputTokens: 4096 },
  { name: 'claude-3-haiku', displayName: 'Claude 3 Haiku', provider: 'Anthropic', inputCost: 0.00025, outputCost: 0.00125, maxInputTokens: 200000, maxOutputTokens: 4096 },
  { name: 'claude-3.5-haiku', displayName: 'Claude 3.5 Haiku', provider: 'Anthropic', inputCost: 0.0008, outputCost: 0.004, maxInputTokens: 200000, maxOutputTokens: 8192 },

  // Google
  { name: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', provider: 'Google', inputCost: 0.0001, outputCost: 0.0004, maxInputTokens: 1048576, maxOutputTokens: 8192 },
  { name: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', provider: 'Google', inputCost: 0.00125, outputCost: 0.005, maxInputTokens: 2097152, maxOutputTokens: 8192 },
  { name: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash', provider: 'Google', inputCost: 0.000075, outputCost: 0.0003, maxInputTokens: 1048576, maxOutputTokens: 8192 },

  // AWS Bedrock (same models with AWS markup)
  { name: 'bedrock-claude-3.5-sonnet', displayName: 'Claude 3.5 Sonnet', provider: 'AWS Bedrock', inputCost: 0.003, outputCost: 0.015, maxInputTokens: 200000, maxOutputTokens: 8192 },
  { name: 'bedrock-claude-3-haiku', displayName: 'Claude 3 Haiku', provider: 'AWS Bedrock', inputCost: 0.00025, outputCost: 0.00125, maxInputTokens: 200000, maxOutputTokens: 4096 },
  { name: 'bedrock-claude-3-opus', displayName: 'Claude 3 Opus', provider: 'AWS Bedrock', inputCost: 0.015, outputCost: 0.075, maxInputTokens: 200000, maxOutputTokens: 4096 },

  // Azure OpenAI
  { name: 'azure-gpt-4o', displayName: 'GPT-4o', provider: 'Azure', inputCost: 0.0025, outputCost: 0.01, maxInputTokens: 128000, maxOutputTokens: 16384 },
  { name: 'azure-gpt-4o-mini', displayName: 'GPT-4o Mini', provider: 'Azure', inputCost: 0.00015, outputCost: 0.0006, maxInputTokens: 128000, maxOutputTokens: 16384 },
  { name: 'azure-gpt-4-turbo', displayName: 'GPT-4 Turbo', provider: 'Azure', inputCost: 0.01, outputCost: 0.03, maxInputTokens: 128000, maxOutputTokens: 4096 },
  { name: 'azure-gpt-4', displayName: 'GPT-4', provider: 'Azure', inputCost: 0.03, outputCost: 0.06, maxInputTokens: 8192, maxOutputTokens: 8192 },
];

// Simple tokenizer estimation (GPT-like: ~4 chars per token for English, ~2 for CJK)
function estimateTokens(text: string): number {
  if (!text) return 0;

  let tokens = 0;
  for (const char of text) {
    // CJK characters (Hangul, Han, kana)
    if (/[\uac00-\ud7af\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(char)) {
      tokens += 0.5;
    }
    // Spaces and punctuation
    else if (/\s/.test(char)) {
      tokens += 0.25;
    }
    // Regular characters
    else {
      tokens += 0.25; // ~4 chars per token for English
    }
  }

  return Math.ceil(tokens);
}

export default function LlmCostCalculator({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tc = translations.tools.llmCost;

  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [inputTokensManual, setInputTokensManual] = useState('');
  const [outputTokensManual, setOutputTokensManual] = useState('1000');
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(() => new Set(MODEL_PRICES.map(m => m.provider)));
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set(MODEL_PRICES.map(m => m.name)));
  const [useManualTokens, setUseManualTokens] = useState(false);
  const [requestCount, setRequestCount] = useState('1');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showPricingTable, setShowPricingTable] = useState(false);

  // Currency settings
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [showExchangeRates, setShowExchangeRates] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(() => {
    const rates: Record<string, number> = {};
    CURRENCIES.forEach(c => { rates[c.code] = c.defaultRate; });
    return rates;
  });
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [ratesLastUpdated, setRatesLastUpdated] = useState<string | null>(null);
  const [ratesError, setRatesError] = useState<string | null>(null);

  // Fetch real-time exchange rates from ExchangeRate-API (free, no API key required)
  const fetchExchangeRates = async () => {
    setIsLoadingRates(true);
    setRatesError(null);
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();

      if (data.result === 'success' && data.rates) {
        const newRates: Record<string, number> = { USD: 1 };
        CURRENCIES.forEach(c => {
          if (c.code !== 'USD' && data.rates[c.code]) {
            newRates[c.code] = data.rates[c.code];
          }
        });
        setExchangeRates(newRates);
        setRatesLastUpdated(new Date().toLocaleString());
      } else {
        setRatesError(t(tc.ratesError));
      }
    } catch {
      setRatesError(t(tc.networkError));
    } finally {
      setIsLoadingRates(false);
    }
  };

  // Auto-fetch exchange rates on mount
  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const inputTokens = useManualTokens
    ? parseInt(inputTokensManual) || 0
    : estimateTokens(inputText);

  const outputTokens = useManualTokens
    ? parseInt(outputTokensManual) || 0
    : estimateTokens(outputText) || parseInt(outputTokensManual) || 0;

  const requests = parseInt(requestCount) || 1;

  const providers = useMemo(() => {
    return [...new Set(MODEL_PRICES.map((m) => m.provider))];
  }, []);

  const filteredModels = useMemo(() => {
    return MODEL_PRICES
      .filter((m) => selectedProviders.has(m.provider))
      .filter((m) => selectedModels.has(m.name));
  }, [selectedProviders, selectedModels]);

  const toggleProvider = (provider: string) => {
    const newSet = new Set(selectedProviders);
    if (newSet.has(provider)) {
      newSet.delete(provider);
    } else {
      newSet.add(provider);
    }
    setSelectedProviders(newSet);
  };

  const selectAllProviders = () => {
    setSelectedProviders(new Set(providers));
  };

  const deselectAllProviders = () => {
    setSelectedProviders(new Set());
  };

  const calculateCost = (model: ModelPrice) => {
    const inputCost = (inputTokens / 1000) * model.inputCost * requests;
    const outputCost = (outputTokens / 1000) * model.outputCost * requests;
    return { inputCost, outputCost, totalCost: inputCost + outputCost };
  };

  const sortedModels = useMemo(() => {
    return [...filteredModels].sort((a, b) => {
      const costA = calculateCost(a).totalCost;
      const costB = calculateCost(b).totalCost;
      return costA - costB;
    });
  }, [filteredModels, inputTokens, outputTokens, requests]);

  const cheapestCost = useMemo(() => {
    if (sortedModels.length === 0) return 0;
    return calculateCost(sortedModels[0]).totalCost;
  }, [sortedModels, inputTokens, outputTokens, requests]);

  const currentCurrency = CURRENCIES.find(c => c.code === selectedCurrency) || CURRENCIES[0];
  const currentRate = exchangeRates[selectedCurrency] || 1;

  const formatCost = (usdCost: number): string => {
    const cost = selectedCurrency === 'USD' ? usdCost : usdCost * currentRate;
    const symbol = currentCurrency.symbol;

    if (cost === 0) return `${symbol}0`;
    if (selectedCurrency === 'USD') {
      if (cost < 0.0001) return `${symbol}${cost.toExponential(2)}`;
      if (cost < 0.01) return `${symbol}${cost.toFixed(4)}`;
      if (cost < 1) return `${symbol}${cost.toFixed(3)}`;
      return `${symbol}${cost.toFixed(2)}`;
    }
    // For other currencies
    if (cost < 1) return `${symbol}${cost.toFixed(2)}`;
    if (cost < 1000) return `${symbol}${Math.round(cost).toLocaleString()}`;
    return `${symbol}${Math.round(cost).toLocaleString()}`;
  };

  const formatComparison = (totalCost: number): string => {
    if (cheapestCost === 0 || totalCost === cheapestCost) return '-';
    const diff = ((totalCost - cheapestCost) / cheapestCost) * 100;
    return `+${diff.toFixed(0)}%`;
  };

  const toggleModel = (modelName: string) => {
    const newSet = new Set(selectedModels);
    if (newSet.has(modelName)) {
      newSet.delete(modelName);
    } else {
      newSet.add(modelName);
    }
    setSelectedModels(newSet);
  };

  const selectAllModels = () => {
    setSelectedModels(new Set(MODEL_PRICES.map(m => m.name)));
  };

  const deselectAllModels = () => {
    setSelectedModels(new Set());
  };

  const selectProviderModels = (provider: string) => {
    const newSet = new Set(selectedModels);
    MODEL_PRICES.filter(m => m.provider === provider).forEach(m => newSet.add(m.name));
    setSelectedModels(newSet);
  };

  const deselectProviderModels = (provider: string) => {
    const newSet = new Set(selectedModels);
    MODEL_PRICES.filter(m => m.provider === provider).forEach(m => newSet.delete(m.name));
    setSelectedModels(newSet);
  };

  const presets = [
    { labelKey: 'presetShort' as const, input: 500, output: 500 },
    { labelKey: 'presetNormal' as const, input: 1000, output: 1000 },
    { labelKey: 'presetLong' as const, input: 2000, output: 4000 },
    { labelKey: 'presetCode' as const, input: 3000, output: 2000 },
    { labelKey: 'presetDoc' as const, input: 10000, output: 2000 },
    { labelKey: 'presetBulk' as const, input: 1000, output: 500, requests: 1000 },
  ];

  const formatTokenCount = (tokens: number): string => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`;
    }
    return tokens.toString();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Input Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setUseManualTokens(false)}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${!useManualTokens
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] text-[var(--color-text)] border border-[var(--color-border)]'
            }`}
        >
          {t(tc.textMode)}
        </button>
        <button
          onClick={() => setUseManualTokens(true)}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${useManualTokens
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] text-[var(--color-text)] border border-[var(--color-border)]'
            }`}
        >
          {t(tc.manualMode)}
        </button>
      </div>

      {/* Text Input Mode */}
      {!useManualTokens && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text)]">
              {t(tc.inputText)}
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t(tc.inputPlaceholder)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
                bg-[var(--color-card)] text-[var(--color-text)]
                focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <div className="flex justify-between text-sm text-[var(--color-text-muted)]">
              <span>{inputText.length.toLocaleString()}{t(tc.characters)}</span>
              <span>≈ {estimateTokens(inputText).toLocaleString()} {t(tc.tokensEstimated)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text)]">
              {t(tc.outputText)}
            </label>
            <textarea
              value={outputText}
              onChange={(e) => setOutputText(e.target.value)}
              placeholder={t(tc.outputPlaceholder)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
                bg-[var(--color-card)] text-[var(--color-text)]
                focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <div className="flex justify-between text-sm text-[var(--color-text-muted)]">
              <span>{outputText.length.toLocaleString()}{t(tc.characters)}</span>
              <span>≈ {estimateTokens(outputText).toLocaleString()} {t(tc.tokensEstimated)}</span>
            </div>
          </div>

          {!outputText && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--color-text)]">
                  {t(tc.outputTokensAlt)}
                </label>
                <input
                  type="number"
                  value={outputTokensManual}
                  onChange={(e) => setOutputTokensManual(e.target.value)}
                  placeholder="1000"
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
                    bg-[var(--color-card)] text-[var(--color-text)]
                    focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--color-text)]">
                  {t(tc.requestCount)}
                </label>
                <input
                  type="number"
                  value={requestCount}
                  onChange={(e) => setRequestCount(e.target.value)}
                  placeholder="1"
                  min="1"
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
                    bg-[var(--color-card)] text-[var(--color-text)]
                    focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          {outputText && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--color-text)]">
                {t(tc.requestCount)}
              </label>
              <input
                type="number"
                value={requestCount}
                onChange={(e) => setRequestCount(e.target.value)}
                placeholder="1"
                min="1"
                className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
                  bg-[var(--color-card)] text-[var(--color-text)]
                  focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Manual Token Input Mode */}
      {useManualTokens && (
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text)]">
              {t(tc.inputTokens)}
            </label>
            <input
              type="number"
              value={inputTokensManual}
              onChange={(e) => setInputTokensManual(e.target.value)}
              placeholder="1000"
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
                bg-[var(--color-card)] text-[var(--color-text)]
                focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text)]">
              {t(tc.outputTokens)}
            </label>
            <input
              type="number"
              value={outputTokensManual}
              onChange={(e) => setOutputTokensManual(e.target.value)}
              placeholder="1000"
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
                bg-[var(--color-card)] text-[var(--color-text)]
                focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text)]">
              {t(tc.requestCount)}
            </label>
            <input
              type="number"
              value={requestCount}
              onChange={(e) => setRequestCount(e.target.value)}
              placeholder="1"
              min="1"
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
                bg-[var(--color-card)] text-[var(--color-text)]
                focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      )}

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.labelKey}
            onClick={() => {
              setUseManualTokens(true);
              setInputTokensManual(String(preset.input));
              setOutputTokensManual(String(preset.output));
              if (preset.requests) setRequestCount(String(preset.requests));
            }}
            className="px-3 py-1 text-sm rounded-lg bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
              border border-[var(--color-border)] text-[var(--color-text-muted)]"
          >
            {t(tc[preset.labelKey])}
          </button>
        ))}
      </div>

      {/* Token Summary */}
      <div className="p-4 rounded-lg bg-primary-500/10 border border-primary-500/20">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">{t(tc.inputTokensSummary)}</p>
            <p className="text-2xl font-bold text-[var(--color-text)]">{inputTokens.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">{t(tc.outputTokensSummary)}</p>
            <p className="text-2xl font-bold text-[var(--color-text)]">{outputTokens.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">{t(tc.requestsSummary)}</p>
            <p className="text-2xl font-bold text-[var(--color-text)]">{requests.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Currency Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[var(--color-text)]">{t(tc.currencySelect)}</label>
          <button
            onClick={() => setShowExchangeRates(!showExchangeRates)}
            className="text-sm text-primary-500 hover:underline"
          >
            {showExchangeRates ? t(tc.exchangeClose) : t(tc.exchangeSettings)}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {CURRENCIES.map((currency) => (
            <button
              key={currency.code}
              onClick={() => setSelectedCurrency(currency.code)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors
                ${selectedCurrency === currency.code
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] text-[var(--color-text)] border border-[var(--color-border)]'
                }`}
            >
              {currency.symbol} {t(tc[currency.nameKey])}
            </button>
          ))}
        </div>

        {showExchangeRates && (
          <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] mt-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-[var(--color-text-muted)]">{t(tc.exchangeRate)}</p>
              <button
                onClick={fetchExchangeRates}
                disabled={isLoadingRates}
                className="px-3 py-1 text-sm rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingRates ? t(tc.fetchingRates) : t(tc.fetchRates)}
              </button>
            </div>

            {ratesError && (
              <p className="text-sm text-red-500 mb-3">{ratesError}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CURRENCIES.filter(c => c.code !== 'USD').map((currency) => (
                <div key={currency.code} className="space-y-1">
                  <label className="block text-xs text-[var(--color-text-muted)]">
                    {currency.symbol} {t(tc[currency.nameKey])}
                  </label>
                  <input
                    type="number"
                    value={exchangeRates[currency.code]}
                    onChange={(e) => setExchangeRates({
                      ...exchangeRates,
                      [currency.code]: parseFloat(e.target.value) || 0
                    })}
                    step="0.01"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)]
                      bg-[var(--color-bg)] text-[var(--color-text)]
                      focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-muted)]">
                {ratesLastUpdated ? (
                  <>{t(tc.lastUpdated)}: {ratesLastUpdated}</>
                ) : (
                  <>{t(tc.defaultRates)}</>
                )}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {t(tc.exchangeSource)}:{' '}
                <a
                  href="https://www.exchangerate-api.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:underline"
                >
                  ExchangeRate-API
                </a>
                {' '}(Open Exchange Rates)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Provider Filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[var(--color-text)]">{t(tc.providerFilter)}</label>
          <div className="flex gap-2">
            <button
              onClick={selectAllProviders}
              className="text-xs text-primary-500 hover:underline"
            >
              {t(tc.selectAll)}
            </button>
            <span className="text-[var(--color-text-muted)]">|</span>
            <button
              onClick={deselectAllProviders}
              className="text-xs text-[var(--color-text-muted)] hover:underline"
            >
              {t(tc.deselectAll)}
            </button>
            <span className="text-[var(--color-text-muted)]">|</span>
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="text-xs text-primary-500 hover:underline"
            >
              {showModelSelector ? t(tc.modelSelectClose) : t(tc.modelSelect)}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {providers.map((provider) => (
            <button
              key={provider}
              onClick={() => toggleProvider(provider)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors
                ${selectedProviders.has(provider)
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] text-[var(--color-text)] border border-[var(--color-border)]'
                }`}
            >
              {provider}
            </button>
          ))}
        </div>
      </div>

      {/* Model Selector */}
      {showModelSelector && (
        <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
          <div className="flex gap-2 mb-4">
            <button
              onClick={selectAllModels}
              className="px-3 py-1 text-sm rounded-lg bg-primary-500/10 text-primary-500 hover:bg-primary-500/20"
            >
              {t(tc.selectAll)}
            </button>
            <button
              onClick={deselectAllModels}
              className="px-3 py-1 text-sm rounded-lg bg-[var(--color-card-hover)] text-[var(--color-text-muted)]"
            >
              {t(tc.deselectAll)}
            </button>
          </div>

          {[...new Set(MODEL_PRICES.map(m => m.provider))].map((provider) => (
            <div key={provider} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-[var(--color-text)]">{provider}</span>
                <button
                  onClick={() => selectProviderModels(provider)}
                  className="text-xs text-primary-500 hover:underline"
                >
                  {t(tc.select)}
                </button>
                <button
                  onClick={() => deselectProviderModels(provider)}
                  className="text-xs text-[var(--color-text-muted)] hover:underline"
                >
                  {t(tc.deselect)}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {MODEL_PRICES.filter(m => m.provider === provider).map((model) => (
                  <label
                    key={model.name}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm cursor-pointer transition-colors
                      ${selectedModels.has(model.name)
                        ? 'bg-primary-500/10 text-primary-500 border border-primary-500/30'
                        : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedModels.has(model.name)}
                      onChange={() => toggleModel(model.name)}
                      className="hidden"
                    />
                    {model.displayName}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cost Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="text-left py-3 px-2 text-[var(--color-text-muted)] font-medium">{t(tc.model)}</th>
              <th className="text-right py-3 px-2 text-[var(--color-text-muted)] font-medium">{t(tc.inputCost)}</th>
              <th className="text-right py-3 px-2 text-[var(--color-text-muted)] font-medium">{t(tc.outputCost)}</th>
              <th className="text-right py-3 px-2 text-[var(--color-text-muted)] font-medium">{t(tc.totalCost)}</th>
              <th className="text-right py-3 px-2 text-[var(--color-text-muted)] font-medium">{t(tc.comparison)}</th>
            </tr>
          </thead>
          <tbody>
            {sortedModels.map((model, index) => {
              const { inputCost, outputCost, totalCost } = calculateCost(model);
              const isFirst = index === 0;
              const isOverLimit = inputTokens > model.maxInputTokens || outputTokens > model.maxOutputTokens;

              return (
                <tr
                  key={model.name}
                  className={`border-b border-[var(--color-border)] ${isOverLimit ? 'opacity-50' : ''} ${isFirst ? 'bg-green-500/5' : ''}`}
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      {isFirst && <span className="text-green-500">1</span>}
                      {index === 1 && <span className="text-[var(--color-text-muted)]">2</span>}
                      {index === 2 && <span className="text-[var(--color-text-muted)]">3</span>}
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{model.displayName}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{model.provider}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 font-mono text-[var(--color-text)]">
                    {formatCost(inputCost)}
                  </td>
                  <td className="text-right py-3 px-2 font-mono text-[var(--color-text)]">
                    {formatCost(outputCost)}
                  </td>
                  <td className="text-right py-3 px-2 font-mono font-bold text-primary-500">
                    {formatCost(totalCost)}
                  </td>
                  <td className="text-right py-3 px-2 font-mono text-[var(--color-text-muted)]">
                    {isFirst ? (
                      <span className="text-green-500">{t(tc.lowest)}</span>
                    ) : (
                      <span className="text-red-400">{formatComparison(totalCost)}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sortedModels.length === 0 && (
          <p className="text-center py-8 text-[var(--color-text-muted)]">
            {t(tc.selectModels)}
          </p>
        )}
      </div>

      {/* Pricing Table Toggle */}
      <div className="space-y-2">
        <button
          onClick={() => setShowPricingTable(!showPricingTable)}
          className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] border border-[var(--color-border)] text-[var(--color-text)]"
        >
          {showPricingTable ? '▲ ' : '▼ '}{t(tc.pricingTable)}
        </button>

        {showPricingTable && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-3 px-2 text-[var(--color-text-muted)] font-medium">{t(tc.model)}</th>
                  <th className="text-right py-3 px-2 text-[var(--color-text-muted)] font-medium">{t(tc.pricePer1kInput)}</th>
                  <th className="text-right py-3 px-2 text-[var(--color-text-muted)] font-medium">{t(tc.pricePer1kOutput)}</th>
                  <th className="text-right py-3 px-2 text-[var(--color-text-muted)] font-medium">{t(tc.maxInput)}</th>
                  <th className="text-right py-3 px-2 text-[var(--color-text-muted)] font-medium">{t(tc.maxOutput)}</th>
                </tr>
              </thead>
              <tbody>
                {MODEL_PRICES.map((model) => (
                  <tr key={model.name} className="border-b border-[var(--color-border)]">
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{model.displayName}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{model.provider}</p>
                      </div>
                    </td>
                    <td className="text-right py-3 px-2 font-mono text-[var(--color-text)]">
                      ${model.inputCost.toFixed(6).replace(/\.?0+$/, '')}
                    </td>
                    <td className="text-right py-3 px-2 font-mono text-[var(--color-text)]">
                      ${model.outputCost.toFixed(6).replace(/\.?0+$/, '')}
                    </td>
                    <td className="text-right py-3 px-2 font-mono text-[var(--color-text-muted)]">
                      {formatTokenCount(model.maxInputTokens)}
                    </td>
                    <td className="text-right py-3 px-2 font-mono text-[var(--color-text-muted)]">
                      {formatTokenCount(model.maxOutputTokens)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pricing Info */}
      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <h3 className="font-medium text-[var(--color-text)] mb-2">{t(tc.notes)}</h3>
        <ul className="text-sm text-[var(--color-text-muted)] space-y-1">
          <li>• {t(tc.priceDate)}</li>
          <li>• {t(tc.tokenEstimation)}</li>
          <li>• {t(tc.cjkTokenNote)}</li>
          <li>• {t(tc.exchangeNote)} <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">ExchangeRate-API</a>{t(tc.exchangeNoteSuffix)}</li>
        </ul>

        <h4 className="font-medium text-[var(--color-text)] mt-4 mb-2">{t(tc.tokenReference)}</h4>
        <ul className="text-sm text-[var(--color-text-muted)] space-y-1">
          <li>• <a href="https://platform.openai.com/tokenizer" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">OpenAI Tokenizer</a> - {t(tc.openaiTokenizer)}</li>
          <li>• <a href="https://docs.anthropic.com/en/api/messages-count-tokens" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">Anthropic Token Counting</a> - {t(tc.anthropicTokens)}</li>
          <li>• <a href="https://ai.google.dev/gemini-api/docs/tokens" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">Gemini Token Guide</a> - {t(tc.geminiTokens)}</li>
        </ul>

        <h4 className="font-medium text-[var(--color-text)] mt-4 mb-2">{t(tc.priceSources)}</h4>
        <p className="text-sm text-[var(--color-text-muted)] mb-2">{t(tc.priceSourceNote)}</p>
        <ul className="text-sm text-[var(--color-text-muted)] space-y-1">
          {PRICING_SOURCES.map((source) => (
            <li key={source.name}>
              • <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">{source.name}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
