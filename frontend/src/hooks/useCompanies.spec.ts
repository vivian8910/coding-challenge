import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCompanies } from '../api/companies';
import { useCompanies } from './useCompanies';

vi.mock('../api/companies', () => ({
  getCompanies: vi.fn(),
}));

const mockedGetCompanies = vi.mocked(getCompanies);

const company = (ticker: string) => ({ ticker, cik: `000${ticker}`, name: `${ticker} Inc.` });

describe('useCompanies', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads the first page of companies on mount', async () => {
    mockedGetCompanies.mockResolvedValue({
      companies: [company('AAPL')],
      pagination: { offset: 0, limit: 10, total: 1, hasNext: false },
    });

    const { result } = renderHook(() => useCompanies());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.companies).toEqual([company('AAPL')]);
    expect(mockedGetCompanies).toHaveBeenCalledWith({ search: '', offset: 0, limit: 10 });
  });

  it('advances and resets pagination via goToNextPage/goToPreviousPage', async () => {
    mockedGetCompanies.mockResolvedValue({
      companies: [company('AAPL')],
      pagination: { offset: 0, limit: 10, total: 20, hasNext: true },
    });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.goToNextPage());
    await waitFor(() => expect(result.current.offset).toBe(10));

    act(() => result.current.goToPreviousPage());
    await waitFor(() => expect(result.current.offset).toBe(0));
  });

  it('resets to the first page when the search term changes', async () => {
    mockedGetCompanies.mockResolvedValue({
      companies: [company('AAPL')],
      pagination: { offset: 0, limit: 10, total: 20, hasNext: true },
    });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.goToNextPage());
    await waitFor(() => expect(result.current.offset).toBe(10));

    act(() => result.current.setSearch('MSFT'));

    await waitFor(() => expect(result.current.offset).toBe(0), { timeout: 1000 });
    await waitFor(() =>
      expect(mockedGetCompanies).toHaveBeenLastCalledWith({ search: 'MSFT', offset: 0, limit: 10 }),
    );
  });

  it('surfaces an error message when the request fails', async () => {
    mockedGetCompanies.mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useCompanies());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('Failed to load companies.');
    expect(result.current.companies).toEqual([]);
  });
});
