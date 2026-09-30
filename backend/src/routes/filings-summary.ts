import type { FastifyInstance } from 'fastify';
import { getFilingsSummary } from '../handlers/filings-summary';

/**
 * `GET /filings/summary`: trailing-12-month filing statistics for one or
 * more companies, given as repeated `ticker` query parameters
 * (`?ticker=AAPL&ticker=SPOT`).
 */
export const registerFilingsSummaryRoutes = (app: FastifyInstance): void => {
  app.get('/filings/summary', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          ticker: {
            anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
          },
        },
        additionalProperties: false,
      },
    },
    handler: getFilingsSummary,
  });
};
