/**
 * Base class for every error raised while talking to SEC EDGAR, so callers
 * can distinguish SEC-related failures from unrelated errors with a single
 * `instanceof SecRequestError` check, while still inspecting the specific
 * subtype (status, timeout, etc.) when needed.
 */
export class SecRequestError extends Error {
  readonly url: string;

  constructor(message: string, url: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'SecRequestError';
    this.url = url;
  }
}

/** The request reached SEC EDGAR, but it responded with a non-2xx status. */
export class SecHttpStatusError extends SecRequestError {
  readonly status: number;

  constructor(url: string, status: number) {
    super(`SEC EDGAR request to ${url} failed with status ${status}`, url);
    this.name = 'SecHttpStatusError';
    this.status = status;
  }
}

/** SEC EDGAR responded with `429 Too Many Requests`. */
export class SecRateLimitError extends SecHttpStatusError {
  constructor(url: string) {
    super(url, 429);
    this.name = 'SecRateLimitError';
  }
}

/** The request did not complete within the configured timeout. */
export class SecTimeoutError extends SecRequestError {
  readonly timeoutMs: number;

  constructor(url: string, timeoutMs: number) {
    super(`SEC EDGAR request to ${url} timed out after ${timeoutMs}ms`, url);
    this.name = 'SecTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

/** The request failed before a response was received (DNS, connection, etc.). */
export class SecNetworkError extends SecRequestError {
  constructor(url: string, cause: unknown) {
    super(`SEC EDGAR request to ${url} failed due to a network error`, url, { cause });
    this.name = 'SecNetworkError';
  }
}

/** SEC EDGAR responded successfully, but the body was not valid JSON. */
export class SecMalformedResponseError extends SecRequestError {
  constructor(url: string, cause: unknown) {
    super(`SEC EDGAR response from ${url} could not be parsed as JSON`, url, { cause });
    this.name = 'SecMalformedResponseError';
  }
}
