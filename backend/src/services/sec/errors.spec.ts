import { describe, expect, it } from 'vitest';
import {
  SecHttpStatusError,
  SecMalformedResponseError,
  SecNetworkError,
  SecRateLimitError,
  SecRequestError,
  SecTimeoutError,
} from './errors';

const URL = 'https://data.sec.gov/submissions/CIK0000320193.json';

describe('SEC request errors', () => {
  it('SecHttpStatusError carries the URL and status, and is a SecRequestError', () => {
    const error = new SecHttpStatusError(URL, 503);

    expect(error).toBeInstanceOf(SecRequestError);
    expect(error.url).toBe(URL);
    expect(error.status).toBe(503);
    expect(error.message).toMatch(/503/);
  });

  it('SecRateLimitError is a SecHttpStatusError with status 429', () => {
    const error = new SecRateLimitError(URL);

    expect(error).toBeInstanceOf(SecHttpStatusError);
    expect(error.status).toBe(429);
  });

  it('SecTimeoutError carries the URL and configured timeout', () => {
    const error = new SecTimeoutError(URL, 10_000);

    expect(error).toBeInstanceOf(SecRequestError);
    expect(error.timeoutMs).toBe(10_000);
    expect(error.message).toMatch(/timed out after 10000ms/);
  });

  it('SecNetworkError preserves the underlying cause', () => {
    const cause = new TypeError('fetch failed');
    const error = new SecNetworkError(URL, cause);

    expect(error).toBeInstanceOf(SecRequestError);
    expect(error.cause).toBe(cause);
  });

  it('SecMalformedResponseError preserves the underlying cause', () => {
    const cause = new SyntaxError('Unexpected token');
    const error = new SecMalformedResponseError(URL, cause);

    expect(error).toBeInstanceOf(SecRequestError);
    expect(error.cause).toBe(cause);
  });
});
