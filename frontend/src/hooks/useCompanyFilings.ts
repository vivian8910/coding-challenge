import type { Company, Filing, PaginationMeta, SortDirection } from '@sec-edgar/shared';
import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { getCompanyFilings } from '../api/filings';
import { useOffsetPagination } from './useOffsetPagination';

const PAGE_LIMIT = 20;

export type UseCompanyFilingsResult = {
  company: Company | undefined;
  filings: Filing[];
  pagination: PaginationMeta | undefined;
  availableForms: string[];
  isLoading: boolean;
  error: string | undefined;
  notFound: boolean;
  form: string;
  setForm: (form: string) => void;
  sort: SortDirection;
  setSort: (sort: SortDirection) => void;
  offset: number;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
};

/**
 * Encapsulates the company filings page's filter/sort/pagination state and
 * fetching for a given ticker. Resets to the first page whenever the form
 * filter or sort changes, and distinguishes an unknown ticker (404) from
 * other request failures.
 */
export const useCompanyFilings = (ticker: string | undefined): UseCompanyFilingsResult => {
  const [form, setForm] = useState('');
  const [sort, setSort] = useState<SortDirection>('desc');
  const [company, setCompany] = useState<Company>();
  const [filings, setFilings] = useState<Filing[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>();
  const [availableForms, setAvailableForms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [notFound, setNotFound] = useState(false);

  const { offset, setOffset, goToNextPage, goToPreviousPage } = useOffsetPagination({
    pageSize: PAGE_LIMIT,
    resetKey: `${ticker ?? ''}|${form}|${sort}`,
  });

  // Reset filters/pagination to defaults when the ticker changes (switching
  // companies), and reset only the page when the filter or sort changes.
  // Adjusting state during render (rather than in an effect) avoids an
  // extra render pass.
  const [lastTicker, setLastTicker] = useState(ticker);
  if (lastTicker !== ticker) {
    setLastTicker(ticker);
    setForm('');
    setSort('desc');
    setOffset(0);
  }

  useEffect(() => {
    if (!ticker) {
      setIsLoading(false);
      setError(undefined);
      setNotFound(false);
      setCompany(undefined);
      setFilings([]);
      setPagination(undefined);
      setAvailableForms([]);
      return;
    }

    let cancelled = false;

    setIsLoading(true);
    setError(undefined);
    setNotFound(false);

    getCompanyFilings(ticker, { form, sort, offset, limit: PAGE_LIMIT })
      .then((response) => {
        if (cancelled) return;
        setCompany(response.company);
        setFilings(response.filings);
        setPagination(response.pagination);
        setAvailableForms(response.availableForms);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(err instanceof ApiError ? err.message : 'Failed to load filings.');
        }
        setCompany(undefined);
        setFilings([]);
        setPagination(undefined);
        setAvailableForms([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ticker, form, sort, offset]);

  const handleGoToNextPage = () => {
    goToNextPage(pagination?.hasNext);
  };

  return {
    company,
    filings,
    pagination,
    availableForms,
    isLoading,
    error,
    notFound,
    form,
    setForm,
    sort,
    setSort,
    offset,
    goToNextPage: handleGoToNextPage,
    goToPreviousPage,
  };
};
