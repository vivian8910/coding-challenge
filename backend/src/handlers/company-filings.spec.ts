import { describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app';
import { fetchCompanies } from '../services/sec/companies';
import { fetchSubmissionsColumnar, type RawFilingsColumnar } from '../services/sec/submissions';
import { SecHttpStatusError } from '../services/sec/errors';

vi.mock('../services/sec/companies', () => ({
  fetchCompanies: vi.fn(),
}));

vi.mock('../services/sec/submissions', () => ({
  fetchSubmissionsColumnar: vi.fn(),
}));

const companies = [{ ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.' }];

/**
 * Only the columns `normalizeFilings` reads are populated; the rest of
 * `RawFilingsColumnar`'s fields are irrelevant to these tests.
 */
const columnarBatch = (): RawFilingsColumnar =>
  ({
    accessionNumber: ['0000320193-25-000079', '0000320193-24-000050'],
    filingDate: ['2025-01-01', '2024-01-01'],
    reportDate: ['2024-12-31', '2023-12-31'],
    form: ['10-K', '10-Q'],
    primaryDocument: ['a.htm', 'b.htm'],
  }) as unknown as RawFilingsColumnar;

describe('GET /companies/:ticker/filings', () => {
  it("returns the company's normalized, paginated filings, sorted by filingDate descending by default", async () => {
    vi.mocked(fetchCompanies).mockResolvedValue(companies);
    vi.mocked(fetchSubmissionsColumnar).mockResolvedValue([columnarBatch()]);
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/companies/aapl/filings' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.company).toEqual(companies[0]);
    expect(body.filings.map((f: { accessionNumber: string }) => f.accessionNumber)).toEqual([
      '0000320193-25-000079',
      '0000320193-24-000050',
    ]);
    expect(body.pagination).toEqual({ offset: 0, limit: 20, total: 2, hasNext: false });
    expect(body.availableForms).toEqual(['10-K', '10-Q']);
  });

  it('filters by form, sorts ascending, and paginates', async () => {
    vi.mocked(fetchCompanies).mockResolvedValue(companies);
    vi.mocked(fetchSubmissionsColumnar).mockResolvedValue([columnarBatch()]);
    const app = buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/companies/AAPL/filings?form=10-K&sort=asc&limit=1',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.filings).toHaveLength(1);
    expect(body.filings[0].form).toBe('10-K');
    expect(body.availableForms).toEqual(['10-K', '10-Q']);
  });

  it('returns 404 for an unknown ticker', async () => {
    vi.mocked(fetchCompanies).mockResolvedValue(companies);
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/companies/nope/filings' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: expect.any(String) });
  });

  it('maps an upstream SEC failure to a 502 response', async () => {
    vi.mocked(fetchCompanies).mockResolvedValue(companies);
    vi.mocked(fetchSubmissionsColumnar).mockRejectedValue(
      new SecHttpStatusError('https://data.sec.gov/submissions/CIK0000320193.json', 503),
    );
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/companies/aapl/filings' });

    expect(response.statusCode).toBe(502);
  });

  it('rejects a limit above the configured maximum', async () => {
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/companies/aapl/filings?limit=1000' });

    expect(response.statusCode).toBe(400);
  });
});
