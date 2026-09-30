import {
  SecHttpStatusError,
  SecMalformedResponseError,
  SecNetworkError,
  SecRateLimitError,
  SecTimeoutError,
} from './errors';

const DEFAULT_USER_AGENT = 'SEC EDGAR Filing Explorer (contact@example.com)';
const DEFAULT_TIMEOUT_MS = 10_000;
const RATE_LIMIT_STATUS = 429;

/**
 * SEC EDGAR requires a descriptive `User-Agent` identifying the requester;
 * requests without one are rejected. Configurable via `SEC_USER_AGENT` so
 * deployments can supply their own contact details.
 */
const getUserAgent = (): string => process.env.SEC_USER_AGENT ?? DEFAULT_USER_AGENT;

/**
 * Timeout for SEC EDGAR requests, in milliseconds. Configurable via
 * `SEC_REQUEST_TIMEOUT_MS`; falls back to the default for missing or
 * invalid values.
 */
const getTimeoutMs = (): number => {
  const configured = Number(process.env.SEC_REQUEST_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TIMEOUT_MS;
};

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === 'AbortError';

/**
 * Fetches a JSON resource from SEC EDGAR with the required `User-Agent`
 * header, aborting and throwing `SecTimeoutError` if it takes longer than
 * `timeoutMs` (defaults to `SEC_REQUEST_TIMEOUT_MS`/10s). Throws a specific
 * `SecRequestError` subclass for network failures, non-success responses
 * (`SecRateLimitError` for 429, `SecHttpStatusError` otherwise), and
 * malformed (non-JSON) response bodies.
 */
export const fetchSecJson = async <T>(url: string, timeoutMs = getTimeoutMs()): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': getUserAgent(),
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new SecTimeoutError(url, timeoutMs);
    }
    throw new SecNetworkError(url, error);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    if (response.status === RATE_LIMIT_STATUS) {
      throw new SecRateLimitError(url);
    }
    throw new SecHttpStatusError(url, response.status);
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new SecMalformedResponseError(url, error);
  }
};
