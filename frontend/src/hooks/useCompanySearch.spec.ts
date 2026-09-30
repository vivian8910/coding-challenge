import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCompanies } from '../api/companies';
import { useCompanySearch } from './useCompanySearch';

vi.mock('../api/companies', () => ({
  getCompanies: vi.fn(),
}));

const mockedGetCompanies = vi.mocked(getCompanies);

const company = (ticker: string) => ({ ticker, cik: `000${ticker}`, name: `${ticker} Inc.` });

describe('useCompanySearch', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns no results and does not fetch for a blank query', () => {
    const { result } = renderHook(() => useCompanySearch(''));

    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockedGetCompanies).not.toHaveBeenCalled();
  });

  it('fetches a bounded set of matches for a non-blank query', async () => {
    mockedGetCompanies.mockResolvedValue({
      companies: [company('MSFT')],
      pagination: { offset: 0, limit: 8, total: 1, hasNext: false },
    });

    const { result } = renderHook(() => useCompanySearch('micro'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.results).toEqual([company('MSFT')]);
    expect(mockedGetCompanies).toHaveBeenCalledWith({ search: 'micro', limit: 8 });
  });

  it('returns no results if the search request fails', async () => {
    mockedGetCompanies.mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useCompanySearch('micro'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.results).toEqual([]);
  });
});
