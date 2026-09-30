import type { CompaniesResponse } from '@sec-edgar/shared';
import { buildQueryString, fetchApiJson } from './client';

export type GetCompaniesParams = {
  search?: string;
  offset?: number;
  limit?: number;
};

/** Fetches a page of companies, optionally filtered by a ticker/name search substring. */
export const getCompanies = (params: GetCompaniesParams = {}): Promise<CompaniesResponse> => {
  const query = buildQueryString({
    search: params.search,
    offset: params.offset,
    limit: params.limit,
  });

  return fetchApiJson<CompaniesResponse>(`/companies${query}`);
};
