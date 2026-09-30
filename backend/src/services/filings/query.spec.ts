import { describe, expect, it } from 'vitest';
import type { Filing } from '@sec-edgar/shared';
import { getAvailableForms, queryFilings } from './query';

const filing = (overrides: Partial<Filing>): Filing => ({
  accessionNumber: '0000320193-25-000079',
  filingDate: '2025-01-01',
  reportDate: '2024-12-31',
  form: '10-K',
  primaryDocument: 'doc.htm',
  link: 'https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/doc.htm',
  ...overrides,
});

const filings: Filing[] = [
  filing({ accessionNumber: 'a', filingDate: '2023-01-01', form: '10-K' }),
  filing({ accessionNumber: 'b', filingDate: '2024-06-15', form: '10-Q' }),
  filing({ accessionNumber: 'c', filingDate: '2025-03-10', form: '8-K' }),
];

describe('queryFilings', () => {
  it('defaults to sorting by filingDate descending (most recent first)', () => {
    const result = queryFilings(filings, { offset: 0, limit: 10 });

    expect(result.filings.map((f) => f.accessionNumber)).toEqual(['c', 'b', 'a']);
  });

  it('sorts ascending when sort=asc', () => {
    const result = queryFilings(filings, { sort: 'asc', offset: 0, limit: 10 });

    expect(result.filings.map((f) => f.accessionNumber)).toEqual(['a', 'b', 'c']);
  });

  it('filters by exact form match', () => {
    const result = queryFilings(filings, { form: '10-Q', offset: 0, limit: 10 });

    expect(result.filings).toEqual([filings[1]]);
    expect(result.pagination.total).toBe(1);
  });

  it('returns an empty, well-formed page for a form with no matches', () => {
    const result = queryFilings(filings, { form: '20-F', offset: 0, limit: 10 });

    expect(result.filings).toEqual([]);
    expect(result.pagination).toEqual({ offset: 0, limit: 10, total: 0, hasNext: false });
  });

  it('applies offset and limit, and reports hasNext correctly', () => {
    const result = queryFilings(filings, { offset: 1, limit: 1 });

    expect(result.filings.map((f) => f.accessionNumber)).toEqual(['b']);
    expect(result.pagination).toEqual({ offset: 1, limit: 1, total: 3, hasNext: true });
  });

  it('does not mutate the input array', () => {
    const original = [...filings];

    queryFilings(filings, { sort: 'asc', offset: 0, limit: 10 });

    expect(filings).toEqual(original);
  });
});

describe('getAvailableForms', () => {
  it('returns the distinct form values, sorted alphabetically', () => {
    expect(getAvailableForms(filings)).toEqual(['10-K', '10-Q', '8-K']);
  });

  it('deduplicates repeated form values', () => {
    const withDuplicates = [...filings, filing({ accessionNumber: 'd', form: '10-K' })];

    expect(getAvailableForms(withDuplicates)).toEqual(['10-K', '10-Q', '8-K']);
  });

  it('returns an empty array for no filings', () => {
    expect(getAvailableForms([])).toEqual([]);
  });
});
