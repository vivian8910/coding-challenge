import type { Company } from '@sec-edgar/shared';
import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { getCompanies } from '../api/companies';
import { useDebouncedValue } from './useDebouncedValue';

const SEARCH_DEBOUNCE_MS = 300;
const RESULT_LIMIT = 8;

export type UseCompanySearchResult = {
  results: Company[];
  isLoading: boolean;
  error: string | undefined;
};

/**
 * Debounced, bounded company search for lightweight lookup UI (e.g. a
 * company switcher), as opposed to `useCompanies`, which drives the full
 * paginated Companies page. Returns no results for a blank query rather
 * than fetching the unfiltered company list.
 */
export const useCompanySearch = (query: string): UseCompanySearchResult => {
  const [results, setResults] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setIsLoading(false);
      setError(undefined);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(undefined);

    getCompanies({ search: debouncedQuery, limit: RESULT_LIMIT })
      .then((response) => {
        if (cancelled) return;
        setResults(response.companies);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setResults([]);
        setError(err instanceof ApiError ? err.message : 'Search is currently unavailable.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  return { results, isLoading, error };
};
