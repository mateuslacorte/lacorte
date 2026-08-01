import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  appendExchangeHistory,
  buildSeries,
  createExchangeSnapshot,
  ensureHistoryBackfilled,
  EXCHANGE_HISTORY_STORAGE_KEY,
  fetchExchangeSnapshotByDate,
  getChangeRate,
  loadExchangeHistory,
} from '../exchange-history';

describe('exchange-history', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('creates snapshot from current rates', () => {
    const snapshot = createExchangeSnapshot({
      usdEur: 0.92,
      usdJpy: 157.2,
      usdGbp: 0.79,
      updatedAt: '2026-02-17T12:00:00.000Z',
    });

    expect(snapshot).toEqual({
      timestamp: '2026-02-17T12:00:00.000Z',
      usdEur: 0.92,
      usdJpy: 157.2,
      usdGbp: 0.79,
    });
  });

  it('replaces same-day snapshot with latest value', () => {
    appendExchangeHistory({
      timestamp: '2026-02-17T09:00:00',
      usdEur: 0.9,
      usdJpy: 150,
      usdGbp: 0.77,
    });

    const next = appendExchangeHistory({
      timestamp: '2026-02-17T18:30:00',
      usdEur: 0.92,
      usdJpy: 157,
      usdGbp: 0.79,
    });

    expect(next).toHaveLength(1);
    expect(next[0].usdEur).toBe(0.92);
    expect(next[0].usdJpy).toBe(157);
  });

  it('keeps only the latest 7 daily snapshots', () => {
    for (let day = 1; day <= 8; day += 1) {
      const dayText = String(day).padStart(2, '0');
      appendExchangeHistory({
        timestamp: `2026-02-${dayText}T12:00:00`,
        usdEur: 0.9 + day * 0.001,
        usdJpy: 150 + day,
        usdGbp: 0.77 + day * 0.001,
      });
    }

    const history = loadExchangeHistory();
    expect(history).toHaveLength(7);
    expect(history[0].timestamp.startsWith('2026-02-02')).toBe(true);
    expect(history[6].timestamp.startsWith('2026-02-08')).toBe(true);
  });

  it('returns empty array for corrupted storage data', () => {
    window.localStorage.setItem(EXCHANGE_HISTORY_STORAGE_KEY, '{invalid-json}');
    expect(loadExchangeHistory()).toEqual([]);
  });

  it('calculates change rate correctly', () => {
    expect(getChangeRate(110, 100)).toBeCloseTo(10, 6);
    expect(getChangeRate(90, 100)).toBeCloseTo(-10, 6);
    expect(getChangeRate(100, 100)).toBe(0);
    expect(getChangeRate(100, 0)).toBeNull();
    expect(getChangeRate(100)).toBeNull();
  });

  it('builds series values by selected pair', () => {
    const history = [
      { timestamp: '2026-02-16T12:00:00', usdEur: 0.9, usdJpy: 150, usdGbp: 0.77 },
      { timestamp: '2026-02-17T12:00:00', usdEur: 0.92, usdJpy: 157, usdGbp: 0.79 },
    ];

    const usdEurSeries = buildSeries(history, 'USD/EUR');
    const usdJpySeries = buildSeries(history, 'USD/JPY');

    expect(usdEurSeries).toHaveLength(2);
    expect(usdEurSeries[0].value).toBe(0.9);
    expect(usdEurSeries[1].value).toBe(0.92);
    expect(usdJpySeries[0].value).toBe(150);
    expect(usdJpySeries[1].value).toBe(157);
  });

  it('fetches a snapshot by date from Frankfurter response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        amount: 1,
        base: 'USD',
        date: '2026-02-10',
        rates: {
          EUR: 0.84076,
          JPY: 155.13,
          GBP: 0.79,
        },
      }),
    });

    const snapshot = await fetchExchangeSnapshotByDate('2026-02-10', mockFetch as unknown as typeof fetch);
    expect(snapshot.timestamp).toBe('2026-02-10T00:00:00.000Z');
    expect(snapshot.usdEur).toBe(0.84076);
    expect(snapshot.usdJpy).toBe(155.13);
    expect(snapshot.usdGbp).toBe(0.79);
  });

  it('backfills and merges history when there are missing days', async () => {
    const existing = [
      { timestamp: '2026-02-16T00:00:00.000Z', usdEur: 0.92, usdJpy: 157, usdGbp: 0.79 },
    ];

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        amount: 1,
        base: 'USD',
        date: '2026-02-15',
        rates: { EUR: 0.9, JPY: 156, GBP: 0.78 },
      }),
    });

    const merged = await ensureHistoryBackfilled(existing, 2, mockFetch as unknown as typeof fetch);

    expect(merged).toHaveLength(2);
    expect(merged[0].timestamp.startsWith('2026-02-15')).toBe(true);
    expect(merged[1].timestamp.startsWith('2026-02-16')).toBe(true);
  });

  it('keeps existing history when backfill calls fail', async () => {
    const existing = [
      { timestamp: '2026-02-16T00:00:00.000Z', usdEur: 0.92, usdJpy: 157, usdGbp: 0.79 },
    ];

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn(),
    });

    const merged = await ensureHistoryBackfilled(existing, 2, mockFetch as unknown as typeof fetch);
    expect(merged).toHaveLength(1);
    expect(merged[0].timestamp.startsWith('2026-02-16')).toBe(true);
  });
});
