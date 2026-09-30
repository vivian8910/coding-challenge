import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import { getCompanyFilings } from '../api/filings';
import { useCompanyFilings } from './useCompanyFilings';

vi.mock('../api/filings', () => ({
  getCompanyFilings: vi.fn(),
}));

const mockedGetCompanyFilings = vi.mocked(getCompanyFilings);

const company = { ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.' };

const filing = (accessionNumber: string) => ({
  accessionNumber,
  filingDate: '2024-01-01',
  reportDate: '2023-12-31',
  form: '10-K',
  primaryDocument: 'doc.htm',
  link: `https://sec.gov/${accessionNumber}`,
});

describe('useCompanyFilings', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads filings and available form types for the given ticker on mount', async () => {
    mockedGetCompanyFilings.mockResolvedValue({
      company,
      filings: [filing('0001')],
      pagination: { offset: 0, limit: 20, total: 1, hasNext: false },
      availableForms: ['10-K', '10-Q'],
    });

    const { result } = renderHook(() => useCompanyFilings('AAPL'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.company).toEqual(company);
    expect(result.current.filings).toEqual([filing('0001')]);
    expect(result.current.availableForms).toEqual(['10-K', '10-Q']);
    expect(mockedGetCompanyFilings).toHaveBeenCalledWith('AAPL', {
      form: '',
      sort: 'desc',
      offset: 0,
      limit: 20,
    });
  });

  it('resets to the first page when the form filter or sort changes', async () => {
    mockedGetCompanyFilings.mockResolvedValue({
      company,
      filings: [filing('0001')],
      pagination: { offset: 0, limit: 20, total: 40, hasNext: true },
      availableForms: ['10-K', '10-Q'],
    });

    const { result } = renderHook(() => useCompanyFilings('AAPL'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.goToNextPage());
    await waitFor(() => expect(result.current.offset).toBe(20));

    act(() => result.current.setForm('10-Q'));
    await waitFor(() => expect(result.current.offset).toBe(0));
    await waitFor(() =>
      expect(mockedGetCompanyFilings).toHaveBeenLastCalledWith('AAPL', {
        form: '10-Q',
        sort: 'desc',
        offset: 0,
        limit: 20,
      }),
    );

    act(() => result.current.goToNextPage());
    await waitFor(() => expect(result.current.offset).toBe(20));

    act(() => result.current.setSort('asc'));
    await waitFor(() => expect(result.current.offset).toBe(0));
    await waitFor(() =>
      expect(mockedGetCompanyFilings).toHaveBeenLastCalledWith('AAPL', {
        form: '10-Q',
        sort: 'asc',
        offset: 0,
        limit: 20,
      }),
    );
  });

  it('resets the filter, sort, and page when switching to a different ticker', async () => {
    mockedGetCompanyFilings.mockResolvedValue({
      company,
      filings: [filing('0001')],
      pagination: { offset: 0, limit: 20, total: 40, hasNext: true },
      availableForms: ['10-K', '10-Q'],
    });

    const { result, rerender } = renderHook(({ ticker }) => useCompanyFilings(ticker), {
      initialProps: { ticker: 'AAPL' },
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setForm('10-Q'));
    act(() => result.current.setSort('asc'));
    await waitFor(() => expect(mockedGetCompanyFilings).toHaveBeenLastCalledWith('AAPL', {
      form: '10-Q',
      sort: 'asc',
      offset: 0,
      limit: 20,
    }));
    act(() => result.current.goToNextPage());
    await waitFor(() => expect(result.current.offset).toBe(20));

    rerender({ ticker: 'MSFT' });

    expect(result.current.form).toBe('');
    expect(result.current.sort).toBe('desc');
    expect(result.current.offset).toBe(0);
    await waitFor(() =>
      expect(mockedGetCompanyFilings).toHaveBeenLastCalledWith('MSFT', {
        form: '',
        sort: 'desc',
        offset: 0,
        limit: 20,
      }),
    );
  });

  it('marks an unknown ticker as not found rather than a generic error', async () => {
    mockedGetCompanyFilings.mockRejectedValue(new ApiError(404, 'Company not found.'));

    const { result } = renderHook(() => useCompanyFilings('NOPE'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.notFound).toBe(true);
    expect(result.current.error).toBeUndefined();
  });

  it('surfaces a generic error message for non-404 failures', async () => {
    mockedGetCompanyFilings.mockRejectedValue(new ApiError(502, 'SEC EDGAR is currently unavailable.'));

    const { result } = renderHook(() => useCompanyFilings('AAPL'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.notFound).toBe(false);
    expect(result.current.error).toBe('SEC EDGAR is currently unavailable.');
  });
});
