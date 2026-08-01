'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchUsdBaseRates } from '@/lib/exchange-rates';
import ExchangeRateSparkline from './ExchangeRateSparkline';
import {
  appendExchangeHistory,
  ensureHistoryBackfilled,
  buildSeries,
  createExchangeSnapshot,
  EXCHANGE_HISTORY_MAX_DAYS,
  getChangeRate,
  hydrateFxHistoryFromSupabase,
  loadExchangeHistory,
} from '@/lib/exchange-history';
import type { DashboardExchangeRates, ExchangePair, ExchangeSnapshot } from '@/types/exchange';

interface RateCard {
  pair: ExchangePair;
  digits: number;
  chartColor: string;
}

const RATE_CARDS: RateCard[] = [
  { pair: 'USD/EUR', digits: 4, chartColor: '#2563eb' },
  { pair: 'USD/JPY', digits: 2, chartColor: '#16a34a' },
  { pair: 'USD/GBP', digits: 4, chartColor: '#f97316' },
];

function formatRate(value: number, digits: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatChangeRate(value: number | null): string {
  if (value === null) return 'No record';
  if (value === 0) return '0.00%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function getChangeClass(value: number | null): string {
  if (value === null || value === 0) {
    return 'text-[var(--color-text-muted)] bg-[var(--color-card-hover)]';
  }

  if (value > 0) {
    return 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/20';
  }

  return 'text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-500/20';
}

function calculateChangeRates(
  current: Pick<DashboardExchangeRates, 'usdEur' | 'usdJpy' | 'usdGbp'>,
  previous?: Pick<DashboardExchangeRates, 'usdEur' | 'usdJpy' | 'usdGbp'>,
): Record<ExchangePair, number | null> {
  return {
    'USD/EUR': getChangeRate(current.usdEur, previous?.usdEur),
    'USD/JPY': getChangeRate(current.usdJpy, previous?.usdJpy),
    'USD/GBP': getChangeRate(current.usdGbp, previous?.usdGbp),
  };
}

export default function ExchangeRatesPanel() {
  const [rates, setRates] = useState<DashboardExchangeRates | null>(null);
  const [changeRates, setChangeRates] = useState<Record<ExchangePair, number | null>>({
    'USD/EUR': null,
    'USD/JPY': null,
    'USD/GBP': null,
  });
  const [history, setHistory] = useState<ExchangeSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seriesByPair = useMemo(() => ({
    'USD/EUR': buildSeries(history, 'USD/EUR'),
    'USD/JPY': buildSeries(history, 'USD/JPY'),
    'USD/GBP': buildSeries(history, 'USD/GBP'),
  }), [history]);

  const syncFromHistory = (nextHistory: ExchangeSnapshot[]) => {
    if (nextHistory.length === 0) return;

    const latest = nextHistory[nextHistory.length - 1];
    const previous = nextHistory.length > 1 ? nextHistory[nextHistory.length - 2] : undefined;

    setHistory(nextHistory);
    setRates({
      usdEur: latest.usdEur,
      usdJpy: latest.usdJpy,
      usdGbp: latest.usdGbp,
      updatedAt: latest.timestamp,
    });
    setChangeRates(calculateChangeRates(latest, previous));
  };

  const loadInitialRates = async () => {
    setIsLoading(true);
    try {
      let preparedHistory = await hydrateFxHistoryFromSupabase();
      if (preparedHistory.length === 0) {
        preparedHistory = loadExchangeHistory();
      }

      try {
        preparedHistory = await ensureHistoryBackfilled(preparedHistory, EXCHANGE_HISTORY_MAX_DAYS);
      } catch (backfillError) {
        console.error('Exchange rate backfill failed:', backfillError);
      }

      syncFromHistory(preparedHistory);

      const latestRates = await fetchUsdBaseRates();
      const snapshot = createExchangeSnapshot(latestRates);
      const mergedHistory = appendExchangeHistory(snapshot);
      const previous = mergedHistory.length > 1 ? mergedHistory[mergedHistory.length - 2] : undefined;

      setRates(latestRates);
      setHistory(mergedHistory);
      setChangeRates(calculateChangeRates(latestRates, previous));
      setError(null);
    } catch (fetchError) {
      console.error('Failed to fetch exchange rates:', fetchError);
      setError('Could not load exchange rate data. Please try again shortly.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRates = async () => {
    setIsRefreshing(true);
    try {
      const latestRates = await fetchUsdBaseRates();
      const snapshot = createExchangeSnapshot(latestRates);
      const mergedHistory = appendExchangeHistory(snapshot);
      const previous = mergedHistory.length > 1 ? mergedHistory[mergedHistory.length - 2] : undefined;

      setRates(latestRates);
      setHistory(mergedHistory);
      setChangeRates(calculateChangeRates(latestRates, previous));
      setError(null);
    } catch (fetchError) {
      console.error('Failed to fetch exchange rates:', fetchError);
      setError('Could not load exchange rate data. Please try again shortly.');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadInitialRates();
  }, []);

  const getRateValue = (pair: RateCard['pair']): number | null => {
    if (!rates) return null;
    if (pair === 'USD/EUR') return rates.usdEur;
    if (pair === 'USD/JPY') return rates.usdJpy;
    return rates.usdGbp;
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Today&apos;s Exchange Rates</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Base currency: USD</p>
        </div>
        <button
          type="button"
          onClick={() => void refreshRates()}
          disabled={isLoading || isRefreshing}
          className="btn btn-outline text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {rates && (
        <p className="text-sm text-[var(--color-text-muted)]">
          Last updated: {formatUpdatedAt(rates.updatedAt)}
        </p>
      )}

      {isLoading && !rates && (
        <p className="text-sm text-[var(--color-text-muted)]">Loading exchange rate data...</p>
      )}

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
        <ul aria-label="Exchange rate list" className="divide-y divide-[var(--color-border)]">
          {RATE_CARDS.map((card) => {
            const value = getRateValue(card.pair);
            return (
              <li key={card.pair} className="px-3 py-2.5 flex items-center gap-2">
                <p className="w-[74px] text-xs font-semibold tracking-wide text-primary-600 dark:text-primary-400">
                  {card.pair}
                </p>
                <p className="flex-1 min-w-0 text-right text-base font-bold tabular-nums text-[var(--color-text)]">
                  {value === null ? '-' : formatRate(value, card.digits)}
                </p>
                <div className="shrink-0 flex items-center gap-1.5">
                  <span
                    className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${getChangeClass(changeRates[card.pair])}`}
                  >
                    {formatChangeRate(changeRates[card.pair])}
                  </span>
                  <ExchangeRateSparkline
                    points={seriesByPair[card.pair]}
                    strokeColor={card.chartColor}
                    ariaLabel={`${card.pair} 7-day mini chart`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-xs text-[var(--color-text-muted)]">
        Source:{' '}
        <a
          href="https://frankfurter.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 dark:text-primary-400 hover:underline"
        >
          frankfurter.dev
        </a>
      </p>
    </section>
  );
}
