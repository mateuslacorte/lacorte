import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExchangeRatesPanel from '../ExchangeRatesPanel';

vi.mock('@/lib/exchange-rates', () => ({
  fetchUsdBaseRates: vi.fn(),
}));

vi.mock('@/lib/exchange-history', () => ({
  appendExchangeHistory: vi.fn((snapshot) => [snapshot]),
  ensureHistoryBackfilled: vi.fn(async (stored) => stored),
  buildSeries: vi.fn(() => []),
  createExchangeSnapshot: vi.fn((rates) => ({
    timestamp: rates.updatedAt,
    usdEur: rates.usdEur,
    usdJpy: rates.usdJpy,
    usdGbp: rates.usdGbp,
  })),
  EXCHANGE_HISTORY_MAX_DAYS: 7,
  getChangeRate: vi.fn(() => null),
  loadExchangeHistory: vi.fn(() => []),
  hydrateFxHistoryFromSupabase: vi.fn(async () => []),
}));

import { fetchUsdBaseRates } from '@/lib/exchange-rates';

describe('ExchangeRatesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(fetchUsdBaseRates).mockReturnValue(new Promise(() => {}));

    render(<ExchangeRatesPanel />);

    expect(screen.getByText('Loading exchange rate data...')).toBeInTheDocument();
  });

  it('renders exchange rates after loading', async () => {
    vi.mocked(fetchUsdBaseRates).mockResolvedValue({
      usdEur: 0.9215,
      usdJpy: 150.5,
      usdGbp: 0.7891,
      updatedAt: '2024-01-15T00:00:00.000Z',
    });

    render(<ExchangeRatesPanel />);

    await waitFor(() => {
      expect(screen.getByText('0.9215')).toBeInTheDocument();
    });

    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    expect(screen.getAllByText('No record').length).toBe(3);

    expect(screen.queryByText('7-day trend')).not.toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    vi.mocked(fetchUsdBaseRates).mockRejectedValue(new Error('Network error'));

    render(<ExchangeRatesPanel />);

    expect(await screen.findByText('Could not load exchange rate data. Please try again shortly.'))
      .toBeInTheDocument();
  });

  it('refreshes rates when refresh button is clicked', async () => {
    const user = userEvent.setup();

    vi.mocked(fetchUsdBaseRates)
      .mockResolvedValueOnce({
        usdEur: 0.9215,
        usdJpy: 150.5,
        usdGbp: 0.7891,
        updatedAt: '2024-01-15T00:00:00.000Z',
      })
      .mockResolvedValueOnce({
        usdEur: 0.9220,
        usdJpy: 151.0,
        usdGbp: 0.7900,
        updatedAt: '2024-01-16T00:00:00.000Z',
      });

    render(<ExchangeRatesPanel />);

    await waitFor(() => {
      expect(screen.getByText('0.9215')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(fetchUsdBaseRates).toHaveBeenCalledTimes(2);
    });
  });
});
