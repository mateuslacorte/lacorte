export interface ExchangeApiResponse {
  result?: string;
  rates?: Record<string, number>;
  time_last_update_unix?: number;
  time_last_update_utc?: string;
}

export interface FrankfurterRatesResponse {
  amount?: number;
  base?: string;
  date?: string;
  rates?: Record<string, number>;
}

export interface DashboardExchangeRates {
  usdEur: number;
  usdJpy: number;
  usdGbp: number;
  updatedAt: string;
}

export type ExchangePair = 'USD/EUR' | 'USD/JPY' | 'USD/GBP';

export interface ExchangeSnapshot {
  timestamp: string;
  usdEur: number;
  usdJpy: number;
  usdGbp: number;
}

export interface DashboardSeriesPoint {
  dateLabel: string;
  value: number;
}
