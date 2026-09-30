import type { Filing, PaginationMeta, SortDirection } from '@sec-edgar/shared';

export type FilingQueryParams = {
  form?: string;
  sort?: SortDirection;
  offset: number;
  limit: number;
};

export type FilingsQueryResult = {
  filings: Filing[];
  pagination: PaginationMeta;
};

const DEFAULT_SORT: SortDirection = 'desc';

const compareByFilingDate = (a: Filing, b: Filing, direction: SortDirection): number =>
  direction === 'asc' ? a.filingDate.localeCompare(b.filingDate) : b.filingDate.localeCompare(a.filingDate);

/**
 * Returns the distinct `form` values present across a company's full,
 * unfiltered filing history, sorted alphabetically. Used to populate the
 * form-type filter with only values that will actually match this company,
 * computed from data already fetched for the request rather than a static
 * or per-request-filtered list.
 */
export const getAvailableForms = (filings: Filing[]): string[] =>
  [...new Set(filings.map((filing) => filing.form))].sort((a, b) => a.localeCompare(b));

/**
 * Applies exact form-type filtering, filing-date sorting (most recent first
 * by default), and offset/limit pagination to a company's normalized
 * filings. An unknown form value simply yields an empty, well-formed page
 * rather than an error.
 */
export const queryFilings = (
  filings: Filing[],
  { form, sort = DEFAULT_SORT, offset, limit }: FilingQueryParams,
): FilingsQueryResult => {
  const filtered = form ? filings.filter((filing) => filing.form === form) : filings;
  const sorted = [...filtered].sort((a, b) => compareByFilingDate(a, b, sort));

  const total = sorted.length;
  const page = sorted.slice(offset, offset + limit);

  return {
    filings: page,
    pagination: {
      offset,
      limit,
      total,
      hasNext: offset + page.length < total,
    },
  };
};
