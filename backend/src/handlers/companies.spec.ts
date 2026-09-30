import { describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app';
import { fetchCompanies } from '../services/sec/companies';
import { SecRateLimitError, SecTimeoutError } from '../services/sec/errors';

vi.mock('../services/sec/companies', () => ({
  fetchCompanies: vi.fn(),
}));

const companies = [
  { ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.' },
  { ticker: 'MSFT', cik: '0000789019', name: 'Microsoft Corp' },
];

describe('GET /companies', () => {
  it('returns a paginated list of companies with defaults applied', async () => {
    vi.mocked(fetchCompanies).mockResolvedValue(companies);
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/companies' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      companies,
      pagination: { offset: 0, limit: 10, total: 2, hasNext: false },
    });
  });

  it('filters by the search query parameter', async () => {
    vi.mocked(fetchCompanies).mockResolvedValue(companies);
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/companies?search=msft' });

    expect(response.statusCode).toBe(200);
    expect(response.json().companies).toEqual([companies[1]]);
  });

  it('respects offset and limit query parameters', async () => {
    vi.mocked(fetchCompanies).mockResolvedValue(companies);
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/companies?offset=1&limit=1' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      companies: [companies[1]],
      pagination: { offset: 1, limit: 1, total: 2, hasNext: false },
    });
  });

  it('rejects a limit above the configured maximum', async () => {
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/companies?limit=1000' });

    expect(response.statusCode).toBe(400);
  });

  it('maps a rate limit error from SEC EDGAR to a 429 response', async () => {
    vi.mocked(fetchCompanies).mockRejectedValue(
      new SecRateLimitError('https://www.sec.gov/files/company_tickers.json'),
    );
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/companies' });

    expect(response.statusCode).toBe(429);
    expect(response.json()).toEqual({ error: expect.any(String) });
  });

  it('maps a timeout error from SEC EDGAR to a 504 response', async () => {
    vi.mocked(fetchCompanies).mockRejectedValue(
      new SecTimeoutError('https://www.sec.gov/files/company_tickers.json', 10_000),
    );
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/companies' });

    expect(response.statusCode).toBe(504);
  });

  it('maps an unexpected error to a generic 500 response', async () => {
    vi.mocked(fetchCompanies).mockRejectedValue(new Error('boom'));
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/companies' });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ error: expect.any(String) });
  });
});
