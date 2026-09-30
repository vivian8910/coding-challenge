import type { FastifyInstance } from 'fastify';
import { registerCompaniesRoutes } from './companies';
import { registerCompanyFilingsRoutes } from './company-filings';
import { registerFilingsSummaryRoutes } from './filings-summary';
import { registerHealthRoutes } from './health';

/**
 * Registers all API route modules on the given Fastify instance.
 * Route modules stay thin; request handling lives in `src/handlers`.
 */
export const registerRoutes = (app: FastifyInstance): void => {
  registerHealthRoutes(app);
  registerCompaniesRoutes(app);
  registerCompanyFilingsRoutes(app);
  registerFilingsSummaryRoutes(app);
};
