import type { CompaniesResponse } from '@sec-edgar/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { fetchCompanies } from '../services/sec/companies';
import { searchCompanies } from '../services/companies/search';
import { sendErrorResponse } from './error-response';

export type CompaniesQuerystring = {
  search?: string;
  offset: number;
  limit: number;
};

/**
 * Returns companies matching an optional ticker/name search term, bounded
 * and paginated via `offset`/`limit` (defaulted and clamped by the route's
 * Fastify schema). Backed by SEC's ticker metadata, fetched fresh on every
 * request until caching is added.
 */
export const getCompanies = async (
  request: FastifyRequest<{ Querystring: CompaniesQuerystring }>,
  reply: FastifyReply,
): Promise<FastifyReply | CompaniesResponse> => {
  try {
    const companies = await fetchCompanies();
    const result = searchCompanies(companies, request.query);
    return reply.send(result);
  } catch (error) {
    return sendErrorResponse(error, request, reply);
  }
};
