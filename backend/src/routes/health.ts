import type { FastifyInstance } from 'fastify';
import { getHealth } from '../handlers/health';

/**
 * Health check route used to verify the server is running.
 * The real domain routes (`/companies`, `/companies/:ticker/filings`,
 * `/filings/summary`) are added in later implementation milestones.
 */
export const registerHealthRoutes = (app: FastifyInstance): void => {
  app.get('/health', getHealth);
};
