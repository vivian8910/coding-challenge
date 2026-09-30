import type { FastifyInstance } from 'fastify';
import { getCompanies } from '../handlers/companies';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * `GET /companies`: searchable, paginated company metadata used to populate
 * the companies page and the company search/autocomplete control.
 */
export const registerCompaniesRoutes = (app: FastifyInstance): void => {
  app.get('/companies', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          offset: { type: 'integer', minimum: 0, default: 0 },
          limit: { type: 'integer', minimum: 1, maximum: MAX_LIMIT, default: DEFAULT_LIMIT },
        },
        additionalProperties: false,
      },
    },
    handler: getCompanies,
  });
};
