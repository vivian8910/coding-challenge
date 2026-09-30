import { describe, expect, it } from 'vitest';
import type { Company } from '@sec-edgar/shared';
import { searchCompanies } from './search';

const companies: Company[] = [
  { ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.' },
  { ticker: 'MSFT', cik: '0000789019', name: 'Microsoft Corp' },
  { ticker: 'GOOGL', cik: '0001652044', name: 'Alphabet Inc.' },
];

describe('searchCompanies', () => {
  it('returns all companies paginated when no search term is given', () => {
    const result = searchCompanies(companies, { offset: 0, limit: 2 });

    expect(result.companies).toEqual(companies.slice(0, 2));
    expect(result.pagination).toEqual({ offset: 0, limit: 2, total: 3, hasNext: true });
  });

  it('matches by ticker substring, case-insensitively', () => {
    const result = searchCompanies(companies, { search: 'aap', offset: 0, limit: 10 });

    expect(result.companies).toEqual([companies[0]]);
    expect(result.pagination).toEqual({ offset: 0, limit: 10, total: 1, hasNext: false });
  });

  it('matches by company name substring, case-insensitively', () => {
    const result = searchCompanies(companies, { search: 'alphabet', offset: 0, limit: 10 });

    expect(result.companies).toEqual([companies[2]]);
  });

  it('returns an empty, well-formed page for an unknown search term', () => {
    const result = searchCompanies(companies, { search: 'nonexistent', offset: 0, limit: 10 });

    expect(result.companies).toEqual([]);
    expect(result.pagination).toEqual({ offset: 0, limit: 10, total: 0, hasNext: false });
  });

  it('sets hasNext to false on the last page', () => {
    const result = searchCompanies(companies, { offset: 2, limit: 2 });

    expect(result.companies).toEqual([companies[2]]);
    expect(result.pagination).toEqual({ offset: 2, limit: 2, total: 3, hasNext: false });
  });
});
