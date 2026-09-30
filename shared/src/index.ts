/**
 * Shared domain and API types used by both the backend and the frontend.
 * These mirror the response shapes defined in `requirements.md`.
 */

export type Company = {
  ticker: string;
  cik: string;
  name: string;
};

export type Filing = {
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  form: string;
  primaryDocument: string;
  link: string;
};

export type PaginationMeta = {
  offset: number;
  limit: number;
  total: number;
  hasNext: boolean;
};

export type PaginatedFilingsResponse = {
  company: Company;
  filings: Filing[];
  pagination: PaginationMeta;
  availableForms: string[];
};

export type CompaniesResponse = {
  companies: Company[];
  pagination: PaginationMeta;
};

export type FilingSummary = {
  cik: string;
  name: string;
  ticker: string;
  filingsByForm: Record<string, number>;
  latest10K: string | null;
};

export type SummaryError = {
  ticker: string;
  message: string;
};

export type SummaryResponse = {
  companies: FilingSummary[];
  errors?: SummaryError[];
};

export type SortDirection = 'asc' | 'desc';
