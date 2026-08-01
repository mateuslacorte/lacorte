import { describe, expect, it, vi } from 'vitest';
import {
  buildFrankfurterDateUrl,
  EXCHANGE_API_URL,
  fetchUsdBaseRates,
  mapFrankfurterRates,
} from '../exchange-rates';
import type { FrankfurterRatesResponse } from '@/types/exchange';

describe('exchange-rates', () => {
  it('maps Frankfurter rates into dashboard rates', () => {
    const data: FrankfurterRatesResponse = {
      amount: 1,
      base: 'USD',
      date: '2026-02-17',
      rates: {
        EUR: 0.92,
        JPY: 157.123,
        GBP: 0.79,
      },
    };

    const mapped = mapFrankfurterRates(data);

    expect(mapped.usdEur).toBe(0.92);
    expect(mapped.usdJpy).toBe(157.123);
    expect(mapped.usdGbp).toBe(0.79);
    expect(mapped.updatedAt).toBe('2026-02-17T00:00:00.000Z');
  });

  it('throws when required rate is missing', () => {
    const data: FrankfurterRatesResponse = {
      amount: 1,
      base: 'USD',
      date: '2026-02-17',
      rates: {
        EUR: 0.92,
        JPY: 157.123,
      },
    };

    expect(() => mapFrankfurterRates(data)).toThrow('Missing required exchange rate data: GBP');
  });

  it('fetches from API endpoint and returns mapped data', async () => {
    const data: FrankfurterRatesResponse = {
      amount: 1,
      base: 'USD',
      date: '2026-02-17',
      rates: {
        EUR: 0.95,
        JPY: 158.001,
        GBP: 0.81,
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(data),
    });

    const rates = await fetchUsdBaseRates(mockFetch as unknown as typeof fetch);

    expect(mockFetch).toHaveBeenCalledWith(EXCHANGE_API_URL);
    expect(rates.usdEur).toBe(0.95);
    expect(rates.usdJpy).toBe(158.001);
    expect(rates.usdGbp).toBe(0.81);
    expect(rates.updatedAt).toBe('2026-02-17T00:00:00.000Z');
  });

  it('throws when API response is not ok', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn(),
    });

    await expect(fetchUsdBaseRates(mockFetch as unknown as typeof fetch))
      .rejects
      .toThrow('Failed to fetch exchange rate data.');
  });

  it('builds date-based Frankfurter URL', () => {
    expect(buildFrankfurterDateUrl('2026-02-10'))
      .toBe('https://api.frankfurter.dev/v1/2026-02-10?base=USD&symbols=EUR,JPY,GBP');
  });
});
