import type { FastifyInstance } from 'fastify';
import { getCompanyFilings } from '../handlers/company-filings';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * `GET /companies/:ticker/filings`: paginated, filterable, sortable list of
 * a single company's normalized SEC filings.
 */
export const registerCompanyFilingsRoutes = (app: FastifyInstance): void => {
  app.get('/companies/:ticker/filings', {
    schema: {
      params: {
        type: 'object',
        properties: {
          ticker: { type: 'string' },
        },
        required: ['ticker'],
      },
      querystring: {
        type: 'object',
        properties: {
          form: { type: 'string' },
          sort: { type: 'string', enum: ['asc', 'desc'] },
          offset: { type: 'integer', minimum: 0, default: 0 },
          limit: { type: 'integer', minimum: 1, maximum: MAX_LIMIT, default: DEFAULT_LIMIT },
        },
        additionalProperties: false,
      },
    },
    handler: getCompanyFilings,
  });
};
