import { describe, expect, it } from 'vitest';
import { normalizeFilings } from './filings';
import type { RawFilingsColumnar } from './submissions';

/**
 * Builds a full `RawFilingsColumnar` batch, defaulting every column not
 * relevant to a given test to an array of the same length as the mapped
 * columns (mirroring the live SEC API, where all columns are present).
 */
const makeBatch = (overrides: Partial<RawFilingsColumnar>, length: number): RawFilingsColumnar => ({
  accessionNumber: Array.from({ length }, (_, i) => `accession-${i}`),
  filingDate: Array.from({ length }, () => ''),
  reportDate: Array.from({ length }, () => ''),
  acceptanceDateTime: Array.from({ length }, () => ''),
  act: Array.from({ length }, () => ''),
  form: Array.from({ length }, () => ''),
  fileNumber: Array.from({ length }, () => ''),
  filmNumber: Array.from({ length }, () => ''),
  items: Array.from({ length }, () => ''),
  core_type: Array.from({ length }, () => ''),
  size: Array.from({ length }, () => 0),
  isXBRL: Array.from({ length }, () => 0),
  isInlineXBRL: Array.from({ length }, () => 0),
  isXBRLNumeric: Array.from({ length }, () => 0),
  primaryDocument: Array.from({ length }, () => ''),
  primaryDocDescription: Array.from({ length }, () => ''),
  ...overrides,
});

describe('normalizeFilings', () => {
  it('maps a fully populated batch into a Filing', () => {
    const batch = makeBatch(
      {
        accessionNumber: ['0000320193-25-000079'],
        filingDate: ['2025-09-27'],
        reportDate: ['2025-07-27'],
        form: ['10-K'],
        primaryDocument: ['aapl-20250927.htm'],
      },
      1,
    );

    const filings = normalizeFilings('0000320193', [batch]);

    expect(filings).toEqual([
      {
        accessionNumber: '0000320193-25-000079',
        filingDate: '2025-09-27',
        reportDate: '2025-07-27',
        form: '10-K',
        primaryDocument: 'aapl-20250927.htm',
        link: 'https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/aapl-20250927.htm',
      },
    ]);
  });

  it('flattens multiple batches in order', () => {
    const recent = makeBatch(
      {
        accessionNumber: ['0000320193-25-000079'],
        filingDate: ['2025-09-27'],
        reportDate: ['2025-07-27'],
        form: ['10-K'],
        primaryDocument: ['aapl-20250927.htm'],
      },
      1,
    );
    const historical = makeBatch(
      {
        accessionNumber: ['0000320193-94-000001', '0000320193-95-000002'],
        filingDate: ['1994-01-01', '1995-01-01'],
        reportDate: ['1993-12-31', '1994-12-31'],
        form: ['10-K', '10-Q'],
        primaryDocument: ['a.txt', 'b.txt'],
      },
      2,
    );

    const filings = normalizeFilings('0000320193', [recent, historical]);

    expect(filings.map((f) => f.accessionNumber)).toEqual([
      '0000320193-25-000079',
      '0000320193-94-000001',
      '0000320193-95-000002',
    ]);
  });

  it('produces no filings for a batch with all-empty arrays', () => {
    const filings = normalizeFilings('0000320193', [makeBatch({}, 0)]);

    expect(filings).toEqual([]);
  });

  it('throws when a batch has mismatched array lengths', () => {
    const batch = makeBatch(
      {
        accessionNumber: ['0000320193-25-000079'],
        filingDate: ['2025-09-27'],
        reportDate: [],
        form: ['10-K'],
        primaryDocument: ['aapl-20250927.htm'],
      },
      1,
    );

    expect(() => normalizeFilings('0000320193', [batch])).toThrow(/mismatched lengths/);
  });
});
