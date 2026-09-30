import { describe, expect, it, vi } from 'vitest';
import { fetchSecJson } from './http-client';
import { fetchSubmissionsColumnar } from './submissions';

vi.mock('./http-client', () => ({
  fetchSecJson: vi.fn(),
}));

describe('fetchSubmissionsColumnar', () => {
  it('limits concurrent historical-file fetches via SEC_HISTORICAL_FETCH_CONCURRENCY', async () => {
    const previousConcurrency = process.env.SEC_HISTORICAL_FETCH_CONCURRENCY;
    process.env.SEC_HISTORICAL_FETCH_CONCURRENCY = '2';

    const recent = { accessionNumber: [], form: [] };
    const historicalFileNames = [
      'CIK0000320193-submissions-001.json',
      'CIK0000320193-submissions-002.json',
      'CIK0000320193-submissions-003.json',
      'CIK0000320193-submissions-004.json',
      'CIK0000320193-submissions-005.json',
    ];

    let activeFetches = 0;
    let maxConcurrentFetches = 0;

    vi.mocked(fetchSecJson).mockImplementation(async (url: string) => {
      if (url.endsWith('CIK0000320193.json')) {
        return {
          filings: {
            recent,
            files: historicalFileNames.map((name) => ({ name })),
          },
        };
      }

      activeFetches += 1;
      maxConcurrentFetches = Math.max(maxConcurrentFetches, activeFetches);
      await new Promise((resolve) => setTimeout(resolve, 5));
      activeFetches -= 1;

      const fileName = url.split('/').pop() ?? '';
      return { accessionNumber: [fileName], form: ['10-K'] };
    });

    try {
      await fetchSubmissionsColumnar('0000320193');
    } finally {
      process.env.SEC_HISTORICAL_FETCH_CONCURRENCY = previousConcurrency;
    }

    expect(maxConcurrentFetches).toBeLessThanOrEqual(2);
    expect(maxConcurrentFetches).toBe(2);
  });

  it('returns the recent batch when there are no historical files', async () => {
    const recent = { accessionNumber: ['0000320193-25-000079'], form: ['10-K'] };
    vi.mocked(fetchSecJson).mockResolvedValue({ filings: { recent } });

    const batches = await fetchSubmissionsColumnar('0000320193');

    expect(batches).toEqual([recent]);
    expect(fetchSecJson).toHaveBeenCalledWith(
      'https://data.sec.gov/submissions/CIK0000320193.json',
    );
  });

  it('follows referenced historical filing-history files and appends their batches', async () => {
    const recent = { accessionNumber: ['0000320193-25-000079'], form: ['10-K'] };
    const historical = { accessionNumber: ['0000320193-94-000001'], form: ['10-K'] };

    vi.mocked(fetchSecJson).mockImplementation(async (url: string) => {
      if (url.endsWith('CIK0000320193.json')) {
        return {
          filings: {
            recent,
            files: [{ name: 'CIK0000320193-submissions-001.json' }],
          },
        };
      }
      if (url.endsWith('CIK0000320193-submissions-001.json')) {
        return historical;
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const batches = await fetchSubmissionsColumnar('0000320193');

    expect(batches).toEqual([recent, historical]);
    expect(fetchSecJson).toHaveBeenCalledWith(
      'https://data.sec.gov/submissions/CIK0000320193-submissions-001.json',
    );
  });

  it('follows multiple historical files', async () => {
    const recent = { accessionNumber: [], form: [] };
    const historicalA = { accessionNumber: ['a'], form: ['10-K'] };
    const historicalB = { accessionNumber: ['b'], form: ['10-Q'] };

    vi.mocked(fetchSecJson).mockImplementation(async (url: string) => {
      if (url.endsWith('CIK0000320193.json')) {
        return {
          filings: {
            recent,
            files: [
              { name: 'CIK0000320193-submissions-001.json' },
              { name: 'CIK0000320193-submissions-002.json' },
            ],
          },
        };
      }
      if (url.endsWith('001.json')) return historicalA;
      if (url.endsWith('002.json')) return historicalB;
      throw new Error(`Unexpected URL: ${url}`);
    });

    const batches = await fetchSubmissionsColumnar('0000320193');

    expect(batches).toEqual([recent, historicalA, historicalB]);
  });
});
