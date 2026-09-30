import { describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app';
import { fetchCompanies } from '../services/sec/companies';
import { fetchSubmissionsColumnar, type RawFilingsColumnar } from '../services/sec/submissions';
import { SecTimeoutError } from '../services/sec/errors';

vi.mock('../services/sec/companies', () => ({
  fetchCompanies: vi.fn(),
}));

vi.mock('../services/sec/submissions', () => ({
  fetchSubmissionsColumnar: vi.fn(),
}));

const companies = [
  { ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.' },
  { ticker: 'MSFT', cik: '0000789019', name: 'Microsoft Corp' },
];

/**
 * Only the columns `normalizeFilings` reads are populated; the rest of
 * `RawFilingsColumnar`'s fields are irrelevant to these tests.
 */
const recentColumnarBatch = (): RawFilingsColumnar =>
  ({
    accessionNumber: ['acc-1', 'acc-2'],
    filingDate: [new Date().toISOString().slice(0, 10), '2015-01-01'],
    reportDate: ['2024-12-31', '2014-12-31'],
    form: ['10-K', '8-K'],
    primaryDocument: ['a.htm', 'b.htm'],
  }) as unknown as RawFilingsColumnar;


describe('GET /filings/summary', () => {
  it('returns 400 when no ticker is given', async () => {
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/filings/summary' });

    expect(response.statusCode).toBe(400);
  });

  it('returns filing summaries for multiple companies given as repeated ticker params', async () => {
    vi.mocked(fetchCompanies).mockResolvedValue(companies);
    vi.mocked(fetchSubmissionsColumnar).mockResolvedValue([recentColumnarBatch()]);
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/filings/summary?ticker=AAPL&ticker=MSFT' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.companies).toHaveLength(2);
    expect(body.companies[0]).toEqual({
      cik: '0000320193',
      name: 'Apple Inc.',
      ticker: 'AAPL',
      filingsByForm: { '10-K': 1 },
      latest10K: expect.any(String),
    });
    expect(body.errors).toBeUndefined();
  });

  it('supports a single ticker (non-array querystring value)', async () => {
    vi.mocked(fetchCompanies).mockResolvedValue(companies);
    vi.mocked(fetchSubmissionsColumnar).mockResolvedValue([recentColumnarBatch()]);
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/filings/summary?ticker=AAPL' });

    expect(response.statusCode).toBe(200);
    expect(response.json().companies).toHaveLength(1);
  });

  it('reports an unknown ticker in `errors` without failing the whole request', async () => {
    vi.mocked(fetchCompanies).mockResolvedValue(companies);
    vi.mocked(fetchSubmissionsColumnar).mockResolvedValue([recentColumnarBatch()]);
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/filings/summary?ticker=AAPL&ticker=NOPE' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.companies).toHaveLength(1);
    expect(body.errors).toEqual([{ ticker: 'NOPE', message: expect.any(String) }]);
  });

  it('reports a per-ticker SEC failure in `errors` without failing the whole request', async () => {
    vi.mocked(fetchCompanies).mockResolvedValue(companies);
    vi.mocked(fetchSubmissionsColumnar).mockImplementation(async (cik: string) => {
      if (cik === companies[1].cik) {
        throw new SecTimeoutError('https://data.sec.gov/submissions/CIK0000789019.json', 10_000);
      }
      return [recentColumnarBatch()];
    });
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/filings/summary?ticker=AAPL&ticker=MSFT' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.companies).toHaveLength(1);
    expect(body.companies[0].ticker).toBe('AAPL');
    expect(body.errors).toEqual([{ ticker: 'MSFT', message: expect.any(String) }]);
  });
});
