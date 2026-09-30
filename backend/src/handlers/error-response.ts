import type { FastifyReply, FastifyRequest } from 'fastify';
import { SecRateLimitError, SecRequestError, SecTimeoutError } from '../services/sec/errors';

type ErrorResponseBody = { error: string };

type ErrorDescription = {
  status: number;
  message: string;
  logLevel: 'warn' | 'error';
};

/**
 * Classifies an error raised while handling a request into an HTTP status
 * and a user-facing message, without leaking internal error details (stack
 * traces, upstream bodies, etc.) to API callers. `SecRequestError` subtypes
 * are distinguished so callers can tell rate limiting/timeouts apart from a
 * generic upstream failure; anything else is treated as an unexpected 500.
 */
const describeError = (error: unknown): ErrorDescription => {
  if (error instanceof SecRateLimitError) {
    return {
      status: 429,
      message: 'SEC EDGAR rate limit exceeded. Please retry shortly.',
      logLevel: 'warn',
    };
  }

  if (error instanceof SecTimeoutError) {
    return { status: 504, message: 'SEC EDGAR did not respond in time.', logLevel: 'warn' };
  }

  if (error instanceof SecRequestError) {
    return { status: 502, message: 'SEC EDGAR is currently unavailable.', logLevel: 'warn' };
  }

  return { status: 500, message: 'An unexpected error occurred.', logLevel: 'error' };
};

/**
 * Sends the full HTTP error response for a request that failed outright.
 * Use `describeErrorMessage` instead when a single request aggregates
 * several independent lookups (e.g. the multi-company summary endpoint)
 * and a failure in one must not abort the others.
 */
export const sendErrorResponse = (
  error: unknown,
  request: FastifyRequest,
  reply: FastifyReply,
): FastifyReply => {
  const { status, message, logLevel } = describeError(error);
  request.log[logLevel]({ err: error }, 'Request failed');
  return reply.status(status).send({ error: message } satisfies ErrorResponseBody);
};

/**
 * Logs an error and returns its user-facing message, for callers that need
 * to attach the failure to a partial result (e.g. one ticker's entry in a
 * multi-company summary) rather than short-circuit the whole response.
 */
export const describeErrorMessage = (error: unknown, request: FastifyRequest): string => {
  const { message, logLevel } = describeError(error);
  request.log[logLevel]({ err: error }, 'Request failed for one item in a multi-item request');
  return message;
};
