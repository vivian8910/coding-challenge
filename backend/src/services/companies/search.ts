import type { CompaniesResponse, Company } from '@sec-edgar/shared';

export type CompanySearchParams = {
  search?: string;
  offset: number;
  limit: number;
};

const matchesSearchTerm = (company: Company, term: string): boolean =>
  company.ticker.includes(term) || company.name.toUpperCase().includes(term);

/**
 * Filters companies by ticker/name search term (case-insensitive, substring
 * match), then applies offset/limit pagination. An unknown ticker or name
 * simply yields an empty, well-formed page rather than an error.
 */
export const searchCompanies = (
  companies: Company[],
  { search, offset, limit }: CompanySearchParams,
): CompaniesResponse => {
  const term = search?.trim().toUpperCase();
  const filtered = term ? companies.filter((company) => matchesSearchTerm(company, term)) : companies;

  const total = filtered.length;
  const page = filtered.slice(offset, offset + limit);

  return {
    companies: page,
    pagination: {
      offset,
      limit,
      total,
      hasNext: offset + page.length < total,
    },
  };
};
