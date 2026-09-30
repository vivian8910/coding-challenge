import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import { getFilingsSummary } from '../api/summary';
import { useFilingsSummary } from './useFilingsSummary';

vi.mock('../api/summary', () => ({
  getFilingsSummary: vi.fn(),
}));

const mockedGetFilingsSummary = vi.mocked(getFilingsSummary);

const company = (ticker: string) => ({ ticker, cik: `000${ticker}`, name: `${ticker} Inc.` });

describe('useFilingsSummary', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts with no selected companies and has not compared yet', () => {
    const { result } = renderHook(() => useFilingsSummary());

    expect(result.current.selectedCompanies).toEqual([]);
    expect(result.current.hasCompared).toBe(false);
    expect(result.current.result).toBeUndefined();
  });

  it('adds and removes companies from the selection', () => {
    const { result } = renderHook(() => useFilingsSummary());

    act(() => result.current.addCompany(company('AAPL')));
    act(() => result.current.addCompany(company('MSFT')));

    expect(result.current.selectedCompanies).toEqual([company('AAPL'), company('MSFT')]);

    act(() => result.current.removeCompany('AAPL'));

    expect(result.current.selectedCompanies).toEqual([company('MSFT')]);
  });

  it('does not add the same company twice', () => {
    const { result } = renderHook(() => useFilingsSummary());

    act(() => result.current.addCompany(company('AAPL')));
    act(() => result.current.addCompany(company('AAPL')));

    expect(result.current.selectedCompanies).toEqual([company('AAPL')]);
  });

  it('fetches a summary for the selected tickers when compare is called', async () => {
    mockedGetFilingsSummary.mockResolvedValue({
      companies: [
        {
          cik: '000AAPL',
          name: 'AAPL Inc.',
          ticker: 'AAPL',
          filingsByForm: { '10-K': 1 },
          latest10K: '2024-01-05',
        },
      ],
    });

    const { result } = renderHook(() => useFilingsSummary());
    act(() => result.current.addCompany(company('AAPL')));

    act(() => result.current.compare());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockedGetFilingsSummary).toHaveBeenCalledWith(['AAPL']);
    expect(result.current.hasCompared).toBe(true);
    expect(result.current.result?.companies).toHaveLength(1);
  });

  it('does nothing when compare is called with no selection', () => {
    const { result } = renderHook(() => useFilingsSummary());

    act(() => result.current.compare());

    expect(mockedGetFilingsSummary).not.toHaveBeenCalled();
    expect(result.current.hasCompared).toBe(false);
  });

  it('surfaces a general error message when the request fails', async () => {
    mockedGetFilingsSummary.mockRejectedValue(new ApiError(502, 'SEC EDGAR is currently unavailable.'));

    const { result } = renderHook(() => useFilingsSummary());
    act(() => result.current.addCompany(company('AAPL')));
    act(() => result.current.compare());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('SEC EDGAR is currently unavailable.');
    expect(result.current.result).toBeUndefined();
  });

  it('carries through per-ticker errors alongside successful results', async () => {
    mockedGetFilingsSummary.mockResolvedValue({
      companies: [],
      errors: [{ ticker: 'NOPE', message: 'Unknown ticker: NOPE' }],
    });

    const { result } = renderHook(() => useFilingsSummary());
    act(() => result.current.addCompany(company('NOPE')));
    act(() => result.current.compare());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeUndefined();
    expect(result.current.result?.errors).toEqual([{ ticker: 'NOPE', message: 'Unknown ticker: NOPE' }]);
  });
});
