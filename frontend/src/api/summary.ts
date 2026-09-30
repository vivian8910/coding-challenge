import type { SummaryResponse } from '@sec-edgar/shared';
import { fetchApiJson } from './client';

/** Fetches trailing-12-month filing statistics for one or more tickers. */
export const getFilingsSummary = (tickers: string[]): Promise<SummaryResponse> => {
  const searchParams = new URLSearchParams();
  for (const ticker of tickers) {
    searchParams.append('ticker', ticker);
  }

  return fetchApiJson<SummaryResponse>(`/filings/summary?${searchParams.toString()}`);
};
