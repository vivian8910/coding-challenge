import type { PaginatedFilingsResponse, SortDirection } from '@sec-edgar/shared';
import { buildQueryString, fetchApiJson } from './client';

export type GetCompanyFilingsParams = {
  form?: string;
  sort?: SortDirection;
  offset?: number;
  limit?: number;
};

/** Fetches a page of a company's normalized filings, resolved by ticker. */
export const getCompanyFilings = (
  ticker: string,
  params: GetCompanyFilingsParams = {},
): Promise<PaginatedFilingsResponse> => {
  const query = buildQueryString({
    form: params.form,
    sort: params.sort,
    offset: params.offset,
    limit: params.limit,
  });

  return fetchApiJson<PaginatedFilingsResponse>(
    `/companies/${encodeURIComponent(ticker)}/filings${query}`,
  );
};
