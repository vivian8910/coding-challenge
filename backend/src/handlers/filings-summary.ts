import type { Company, FilingSummary, SummaryError, SummaryResponse } from '@sec-edgar/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { findCompanyByTicker } from '../services/companies/lookup';
import { fetchCompanies } from '../services/sec/companies';
import { fetchSubmissionsColumnar } from '../services/sec/submissions';
import { normalizeFilings } from '../services/sec/filings';
import { summarizeFilings } from '../services/filings/summary';
import { describeErrorMessage, sendErrorResponse } from './error-response';

export type FilingsSummaryQuerystring = {
  ticker?: string | string[];
};

/**
 * Normalizes the `ticker` querystring value into a list: Fastify parses a
 * single `?ticker=X` as a string but multiple repeated `ticker` params as
 * an array, so both shapes must be handled explicitly.
 */
const toTickerList = (ticker: string | string[] | undefined): string[] =>
  ticker === undefined ? [] : Array.isArray(ticker) ? ticker : [ticker];

const buildCompanySummary = async (company: Company): Promise<FilingSummary> => {
  const batches = await fetchSubmissionsColumnar(company.cik);
  const filings = normalizeFilings(company.cik, batches);
  const { filingsByForm, latest10K } = summarizeFilings(filings);

  return { cik: company.cik, name: company.name, ticker: company.ticker, filingsByForm, latest10K };
};

/**
 * Returns filing statistics (filings-by-form over the trailing 12 months,
 * and latest 10-K date) for one or more companies given as repeated
 * `ticker` query parameters. A failure resolving or summarizing one ticker
 * (unknown ticker, SEC unavailable, etc.) is reported in `errors` rather
 * than failing the whole request, so other companies' results still come
 * back with HTTP 200.
 */
export const getFilingsSummary = async (
  request: FastifyRequest<{ Querystring: FilingsSummaryQuerystring }>,
  reply: FastifyReply,
): Promise<FastifyReply | SummaryResponse> => {
  const tickers = toTickerList(request.query.ticker);

  if (tickers.length === 0) {
    return reply.status(400).send({ error: 'At least one `ticker` query parameter is required.' });
  }

  let companies: Company[];
  try {
    companies = await fetchCompanies();
  } catch (error) {
    return sendErrorResponse(error, request, reply);
  }

  const results = await Promise.all(
    tickers.map(async (rawTicker) => {
      const normalizedTicker = rawTicker.trim().toUpperCase();
      const company = findCompanyByTicker(companies, normalizedTicker);

      if (!company) {
        return {
          error: { ticker: normalizedTicker, message: `Unknown ticker: ${normalizedTicker}` },
        } as const;
      }

      try {
        const summary = await buildCompanySummary(company);
        return { summary } as const;
      } catch (error) {
        return {
          error: { ticker: normalizedTicker, message: describeErrorMessage(error, request) },
        } as const;
      }
    }),
  );

  const summaries: FilingSummary[] = results
    .filter((result): result is { summary: FilingSummary } => 'summary' in result)
    .map((result) => result.summary);
  const errors: SummaryError[] = results
    .filter((result): result is { error: SummaryError } => 'error' in result)
    .map((result) => result.error);

  return reply.send({
    companies: summaries,
    ...(errors.length > 0 ? { errors } : {}),
  } satisfies SummaryResponse);
};
