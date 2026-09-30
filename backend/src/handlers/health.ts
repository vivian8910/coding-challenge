import type { FastifyReply, FastifyRequest } from 'fastify';

export type HealthResponse = {
  status: 'ok';
};

/**
 * Returns a simple health payload confirming the API process is running.
 */
export const getHealth = async (
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<HealthResponse> => {
  return reply.send({ status: 'ok' });
};
