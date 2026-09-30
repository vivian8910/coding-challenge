import { describe, expect, it } from 'vitest';
import type { Filing } from '@sec-edgar/shared';
import { summarizeFilings, twelveMonthCutoff } from './summary';

const filing = (overrides: Partial<Filing>): Filing => ({
  accessionNumber: '0000320193-25-000079',
  filingDate: '2025-01-01',
  reportDate: '2024-12-31',
  form: '10-K',
  primaryDocument: 'doc.htm',
  link: 'https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/doc.htm',
  ...overrides,
});

describe('twelveMonthCutoff', () => {
  it('returns the same UTC calendar date 12 months earlier', () => {
    expect(twelveMonthCutoff(new Date('2025-06-15T00:00:00Z'))).toBe('2024-06-15');
  });
});

describe('summarizeFilings', () => {
  const now = new Date('2025-06-15T00:00:00Z');

  it('counts filings by form within the trailing 12 months, excluding older filings', () => {
    const filings: Filing[] = [
      filing({ filingDate: '2025-06-01', form: '10-K' }),
      filing({ filingDate: '2025-01-01', form: '10-Q' }),
      filing({ filingDate: '2025-01-01', form: '10-Q' }),
      filing({ filingDate: '2023-01-01', form: '8-K' }),
    ];

    const result = summarizeFilings(filings, now);

    expect(result.filingsByForm).toEqual({ '10-K': 1, '10-Q': 2 });
  });

  it('includes a filing exactly on the cutoff date', () => {
    const filings: Filing[] = [filing({ filingDate: '2024-06-15', form: '8-K' })];

    const result = summarizeFilings(filings, now);

    expect(result.filingsByForm).toEqual({ '8-K': 1 });
  });

  it('finds the latest 10-K filing date across the full history, ignoring the 12-month window', () => {
    const filings: Filing[] = [
      filing({ filingDate: '2020-01-01', form: '10-K' }),
      filing({ filingDate: '2025-06-01', form: '10-K' }),
      filing({ filingDate: '2022-01-01', form: '10-K' }),
    ];

    const result = summarizeFilings(filings, now);

    expect(result.latest10K).toBe('2025-06-01');
  });

  it('returns null for latest10K when there are no 10-K filings', () => {
    const filings: Filing[] = [filing({ form: '8-K' })];

    const result = summarizeFilings(filings, now);

    expect(result.latest10K).toBeNull();
  });

  it('returns empty counts and null latest10K for no filings', () => {
    const result = summarizeFilings([], now);

    expect(result).toEqual({ filingsByForm: {}, latest10K: null });
  });
});
