import { describe, expect, it, vi } from 'vitest';
import { fetchSecJson } from './http-client';
import {
  SecHttpStatusError,
  SecMalformedResponseError,
  SecNetworkError,
  SecRateLimitError,
  SecTimeoutError,
} from './errors';

const URL = 'https://www.sec.gov/files/company_tickers.json';

describe('fetchSecJson', () => {
  it('requests the given URL with the required User-Agent header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ hello: 'world' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchSecJson(URL);

    expect(result).toEqual({ hello: 'world' });
    expect(fetchMock).toHaveBeenCalledWith(
      URL,
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.any(String),
          Accept: 'application/json',
        }),
        signal: expect.any(AbortSignal),
      }),
    );

    vi.unstubAllGlobals();
  });

  it('uses SEC_USER_AGENT when set', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('SEC_USER_AGENT', 'Test App test@example.com');

    await fetchSecJson(URL);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'User-Agent': 'Test App test@example.com' }),
      }),
    );

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('throws SecHttpStatusError when the response is not successful', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    vi.stubGlobal('fetch', fetchMock);

    const error = await fetchSecJson(URL).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(SecHttpStatusError);
    expect(error as SecHttpStatusError).toMatchObject({ status: 503, url: URL });
    expect((error as Error).message).toMatch(/503/);

    vi.unstubAllGlobals();
  });

  it('throws SecRateLimitError when the response is 429', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 429 });
    vi.stubGlobal('fetch', fetchMock);

    const error = await fetchSecJson(URL).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(SecRateLimitError);
    expect(error).toBeInstanceOf(SecHttpStatusError);

    vi.unstubAllGlobals();
  });

  it('throws SecMalformedResponseError when the body is not valid JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('Unexpected token')),
    });
    vi.stubGlobal('fetch', fetchMock);

    const error = await fetchSecJson(URL).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(SecMalformedResponseError);

    vi.unstubAllGlobals();
  });

  it('throws SecNetworkError when fetch rejects with a non-abort error', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    vi.stubGlobal('fetch', fetchMock);

    const error = await fetchSecJson(URL).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(SecNetworkError);

    vi.unstubAllGlobals();
  });

  it('throws SecTimeoutError and aborts the request when it exceeds the timeout', async () => {
    const fetchMock = vi.fn((_url: string, init?: { signal?: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const abortError = new Error('This operation was aborted');
          abortError.name = 'AbortError';
          reject(abortError);
        });
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const error = await fetchSecJson(URL, 5).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(SecTimeoutError);
    expect(error as SecTimeoutError).toMatchObject({ url: URL, timeoutMs: 5 });

    vi.unstubAllGlobals();
  });
});
