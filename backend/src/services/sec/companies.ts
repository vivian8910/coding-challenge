import type { Company } from '@sec-edgar/shared';
import { fetchSecJson } from './http-client';

const COMPANY_TICKERS_URL = 'https://www.sec.gov/files/company_tickers.json';
const CIK_LENGTH = 10;
const DEFAULT_COMPANIES_CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Raw shape of `company_tickers.json`: an object keyed by arbitrary numeric
 * strings, each value describing one company.
 */
type RawCompanyTickerEntry = {
  cik_str: number;
  ticker: string;
  title: string;
};

type RawCompanyTickers = Record<string, RawCompanyTickerEntry>;

const toZeroPaddedCik = (cik: number): string => String(cik).padStart(CIK_LENGTH, '0');

const toCompany = (entry: RawCompanyTickerEntry): Company => ({
  ticker: entry.ticker.toUpperCase(),
  cik: toZeroPaddedCik(entry.cik_str),
  name: entry.title,
});

/**
 * Company metadata cache TTL in milliseconds. Configurable via
 * `SEC_COMPANIES_CACHE_TTL_MS`; invalid or negative values fall back to the
 * default.
 */
const getCompaniesCacheTtlMs = (): number => {
  const configured = Number(process.env.SEC_COMPANIES_CACHE_TTL_MS);
  return Number.isFinite(configured) && configured >= 0
    ? configured
    : DEFAULT_COMPANIES_CACHE_TTL_MS;
};

let cachedCompanies: Company[] | null = null;
let cacheExpiresAt = 0;

/**
 * Fetches SEC's company ticker metadata and normalizes it into the
 * application's `Company` shape: uppercase ticker and zero-padded CIK.
 */
export const fetchCompanies = async (): Promise<Company[]> => {
  if (cachedCompanies && Date.now() < cacheExpiresAt) {
    return cachedCompanies;
  }

  const raw = await fetchSecJson<RawCompanyTickers>(COMPANY_TICKERS_URL);
  const companies = Object.values(raw).map(toCompany);

  cachedCompanies = companies;
  cacheExpiresAt = Date.now() + getCompaniesCacheTtlMs();

  return companies;
};
