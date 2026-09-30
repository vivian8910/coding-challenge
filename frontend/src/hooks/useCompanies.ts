import type { Company, PaginationMeta } from '@sec-edgar/shared';
import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { getCompanies } from '../api/companies';
import { useDebouncedValue } from './useDebouncedValue';
import { useOffsetPagination } from './useOffsetPagination';

const PAGE_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 300;

export type UseCompaniesResult = {
  companies: Company[];
  pagination: PaginationMeta | undefined;
  isLoading: boolean;
  error: string | undefined;
  search: string;
  setSearch: (search: string) => void;
  offset: number;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
};

/**
 * Encapsulates the companies page's search + pagination state and fetching.
 * Debounces the search term, resets to the first page on a new search, and
 * exposes loading/error state for the page to render explicitly.
 */
export const useCompanies = (): UseCompaniesResult => {
  const [search, setSearch] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const { offset, goToNextPage, goToPreviousPage } = useOffsetPagination({
    pageSize: PAGE_LIMIT,
    resetKey: debouncedSearch,
  });

  const handleGoToNextPage = () => {
    goToNextPage(pagination?.hasNext);
  };

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(undefined);

    getCompanies({ search: debouncedSearch, offset, limit: PAGE_LIMIT })
      .then((response) => {
        if (cancelled) return;
        setCompanies(response.companies);
        setPagination(response.pagination);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load companies.');
        setCompanies([]);
        setPagination(undefined);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, offset]);

  return {
    companies,
    pagination,
    isLoading,
    error,
    search,
    setSearch,
    offset,
    goToNextPage: handleGoToNextPage,
    goToPreviousPage,
  };
};
