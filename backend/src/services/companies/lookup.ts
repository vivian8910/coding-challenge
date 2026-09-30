import type { Company } from '@sec-edgar/shared';

/**
 * Resolves a ticker (normalized to uppercase, trimmed) to its `Company`
 * metadata. Returns `undefined` for an unknown ticker rather than throwing,
 * so callers can decide how to surface "not found" (e.g. HTTP 404).
 */
export const findCompanyByTicker = (companies: Company[], ticker: string): Company | undefined => {
  const normalized = ticker.trim().toUpperCase();
  return companies.find((company) => company.ticker === normalized);
};
