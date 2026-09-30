import { describe, expect, it } from 'vitest';
import type { Company } from '@sec-edgar/shared';
import { findCompanyByTicker } from './lookup';

const companies: Company[] = [
  { ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.' },
  { ticker: 'MSFT', cik: '0000789019', name: 'Microsoft Corp' },
];

describe('findCompanyByTicker', () => {
  it('finds a company by exact ticker match', () => {
    expect(findCompanyByTicker(companies, 'AAPL')).toEqual(companies[0]);
  });

  it('normalizes ticker case and surrounding whitespace before matching', () => {
    expect(findCompanyByTicker(companies, ' aapl ')).toEqual(companies[0]);
  });

  it('returns undefined for an unknown ticker', () => {
    expect(findCompanyByTicker(companies, 'NOPE')).toBeUndefined();
  });
});
