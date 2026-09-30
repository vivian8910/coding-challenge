import type { Company, SummaryResponse } from '@sec-edgar/shared';
import { useState } from 'react';
import { ApiError } from '../api/client';
import { getFilingsSummary } from '../api/summary';

export type UseFilingsSummaryResult = {
  selectedCompanies: Company[];
  addCompany: (company: Company) => void;
  removeCompany: (ticker: string) => void;
  compare: () => void;
  result: SummaryResponse | undefined;
  isLoading: boolean;
  error: string | undefined;
  hasCompared: boolean;
};

/**
 * Manages the Summary page's selected-company list and the explicit
 * "compare" action that fetches trailing-12-month filing statistics for
 * the current selection. `result.errors` (per-ticker SEC/lookup failures)
 * is left for the caller to render alongside `result.companies` rather
 * than being treated as a request failure; `error` is reserved for a
 * failure of the request as a whole (e.g. the backend being unreachable).
 */
export const useFilingsSummary = (): UseFilingsSummaryResult => {
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [result, setResult] = useState<SummaryResponse>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [hasCompared, setHasCompared] = useState(false);

  const addCompany = (company: Company) => {
    setSelectedCompanies((current) =>
      current.some((existing) => existing.ticker === company.ticker)
        ? current
        : [...current, company],
    );
  };

  const removeCompany = (ticker: string) => {
    setSelectedCompanies((current) => current.filter((company) => company.ticker !== ticker));
  };

  const compare = () => {
    if (selectedCompanies.length === 0) return;

    const tickers = selectedCompanies.map((company) => company.ticker);

    setIsLoading(true);
    setError(undefined);
    setHasCompared(true);

    getFilingsSummary(tickers)
      .then((response) => {
        setResult(response);
      })
      .catch((err: unknown) => {
        setResult(undefined);
        setError(err instanceof ApiError ? err.message : 'Failed to load summary.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return {
    selectedCompanies,
    addCompany,
    removeCompany,
    compare,
    result,
    isLoading,
    error,
    hasCompared,
  };
};
