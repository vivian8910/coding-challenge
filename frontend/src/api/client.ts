/**
 * Base URL for the backend API. Defaults to the local backend dev server;
 * override with `VITE_API_BASE_URL` for other environments.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

/** Error thrown for any non-OK API response, carrying the HTTP status. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type ErrorResponseBody = { error?: string };

/**
 * Fetches JSON from the backend API, throwing an `ApiError` for non-OK
 * responses using the backend's `{ error: string }` body when available.
 */
export const fetchApiJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorResponseBody;
    throw new ApiError(response.status, body.error ?? 'Request failed.');
  }

  return (await response.json()) as T;
};

/** Builds a query string from defined parameters, omitting `undefined`/empty values. */
export const buildQueryString = (
  params: Record<string, string | number | undefined>,
): string => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
};
