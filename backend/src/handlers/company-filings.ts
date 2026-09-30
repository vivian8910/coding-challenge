import type { PaginatedFilingsResponse, SortDirection } from '@sec-edgar/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { findCompanyByTicker } from '../services/companies/lookup';
import { fetchCompanies } from '../services/sec/companies';
import { fetchSubmissionsColumnar } from '../services/sec/submissions';
import { normalizeFilings } from '../services/sec/filings';
import { queryFilings, getAvailableForms } from '../services/filings/query';
import { sendErrorResponse } from './error-response';

export type CompanyFilingsParams = {
  ticker: string;
};

export type CompanyFilingsQuerystring = {
  form?: string;
  sort?: SortDirection;
  offset: number;
  limit: number;
};

/**
 * Returns a normalized, paginated list of filings for the company matching
 * `:ticker`: resolves the ticker to a company/CIK, fetches and flattens its
 * SEC submissions (including historical filing-history files), then
 * applies form filtering, filing-date sorting, and offset/limit pagination.
 */
export const getCompanyFilings = async (
  request: FastifyRequest<{ Params: CompanyFilingsParams; Querystring: CompanyFilingsQuerystring }>,
  reply: FastifyReply,
): Promise<FastifyReply | PaginatedFilingsResponse> => {
  try {
    const companies = await fetchCompanies();
    const company = findCompanyByTicker(companies, request.params.ticker);

    if (!company) {
      return reply
        .status(404)
        .send({ error: `Unknown ticker: ${request.params.ticker.trim().toUpperCase()}` });
    }

    const batches = await fetchSubmissionsColumnar(company.cik);
    const filings = normalizeFilings(company.cik, batches);
    const { filings: page, pagination } = queryFilings(filings, request.query);
    const availableForms = getAvailableForms(filings);

    return reply.send({
      company,
      filings: page,
      pagination,
      availableForms,
    } satisfies PaginatedFilingsResponse);
  } catch (error) {
    return sendErrorResponse(error, request, reply);
  }
};
