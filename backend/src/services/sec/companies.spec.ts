import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./http-client', () => ({
  fetchSecJson: vi.fn(),
}));

describe('fetchCompanies', () => {
  const originalCacheTtlMs = process.env.SEC_COMPANIES_CACHE_TTL_MS;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.SEC_COMPANIES_CACHE_TTL_MS = originalCacheTtlMs;
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.SEC_COMPANIES_CACHE_TTL_MS = originalCacheTtlMs;
  });

  it('normalizes ticker to uppercase and CIK to a zero-padded 10-digit string', async () => {
    const { fetchSecJson } = await import('./http-client');
    const { fetchCompanies } = await import('./companies');

    vi.mocked(fetchSecJson).mockResolvedValue({
      '0': { cik_str: 320193, ticker: 'aapl', title: 'Apple Inc.' },
      '1': { cik_str: 1, ticker: 'ZZZ', title: 'Zzz Corp' },
    });

    const companies = await fetchCompanies();

    expect(companies).toEqual([
      { ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.' },
      { ticker: 'ZZZ', cik: '0000000001', name: 'Zzz Corp' },
    ]);
  });

  it('returns an empty array when there are no companies', async () => {
    const { fetchSecJson } = await import('./http-client');
    const { fetchCompanies } = await import('./companies');

    vi.mocked(fetchSecJson).mockResolvedValue({});

    const companies = await fetchCompanies();

    expect(companies).toEqual([]);
  });

  it('uses cached companies within TTL instead of refetching', async () => {
    const { fetchSecJson } = await import('./http-client');
    const { fetchCompanies } = await import('./companies');

    process.env.SEC_COMPANIES_CACHE_TTL_MS = '60000';
    vi.mocked(fetchSecJson).mockResolvedValue({
      '0': { cik_str: 320193, ticker: 'AAPL', title: 'Apple Inc.' },
    });

    const first = await fetchCompanies();
    const second = await fetchCompanies();

    expect(first).toEqual(second);
    expect(fetchSecJson).toHaveBeenCalledTimes(1);
  });

  it('refetches after the cache TTL expires', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    const { fetchSecJson } = await import('./http-client');
    const { fetchCompanies } = await import('./companies');

    process.env.SEC_COMPANIES_CACHE_TTL_MS = '1000';
    vi.mocked(fetchSecJson)
      .mockResolvedValueOnce({
        '0': { cik_str: 320193, ticker: 'AAPL', title: 'Apple Inc.' },
      })
      .mockResolvedValueOnce({
        '0': { cik_str: 789019, ticker: 'MSFT', title: 'Microsoft Corp' },
      });

    const first = await fetchCompanies();
    vi.setSystemTime(new Date('2026-01-01T00:00:02.000Z'));
    const second = await fetchCompanies();

    expect(first).toEqual([{ ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.' }]);
    expect(second).toEqual([{ ticker: 'MSFT', cik: '0000789019', name: 'Microsoft Corp' }]);
    expect(fetchSecJson).toHaveBeenCalledTimes(2);
  });
});
