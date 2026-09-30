import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import { registerRoutes } from './routes';

/**
 * Builds a Fastify application instance without starting the HTTP listener.
 * Kept separate from `server.ts` so tests can build the app without binding a port.
 */
export const buildApp = (): FastifyInstance => {
  const app = Fastify({ logger: true });

  void app.register(cors, { origin: true });

  registerRoutes(app);

  return app;
};
