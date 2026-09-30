import pLimit from 'p-limit';
import { fetchSecJson } from './http-client';

const SUBMISSIONS_BASE_URL = 'https://data.sec.gov/submissions';
const DEFAULT_HISTORICAL_FETCH_CONCURRENCY = 4;

/**
 * Raw shape of SEC's columnar filing data: each field is a parallel array,
 * where index `i` across all fields describes one filing. Both the "recent"
 * block of the main submissions response and each referenced historical
 * file share this shape (verified against the live `data.sec.gov` API,
 * fetched with the required `User-Agent` header).
 * This models the full API response; only a subset of these fields is
 * mapped into the application-facing `Filing` type (see `filings.ts`).
 *
 * Note: SEC's `core_type` field does not mean "form type" — in practice
 * it holds values unrelated to the form (e.g. `"4"`, `"144"`). It is
 * intentionally not modeled/used for the application's `form` field.
 */
export type RawFilingsColumnar = {
  accessionNumber: string[];
  filingDate: string[];
  reportDate: string[];
  acceptanceDateTime: string[];
  act: string[];
  form: string[];
  fileNumber: string[];
  filmNumber: string[];
  items: string[];
  core_type: string[];
  size: number[];
  isXBRL: number[];
  isInlineXBRL: number[];
  isXBRLNumeric: number[];
  primaryDocument: string[];
  primaryDocDescription: string[];
};

type RawHistoricalFilingsFileRef = {
  name: string;
};

type RawSubmissionsResponse = {
  filings: {
    recent: RawFilingsColumnar;
    files?: RawHistoricalFilingsFileRef[];
  };
};

const buildSubmissionsUrl = (cik: string): string => `${SUBMISSIONS_BASE_URL}/CIK${cik}.json`;

const buildHistoricalFileUrl = (fileName: string): string => `${SUBMISSIONS_BASE_URL}/${fileName}`;

/**
 * Maximum number of historical filing-history files to fetch concurrently.
 * Tunable via `SEC_HISTORICAL_FETCH_CONCURRENCY`; invalid or non-positive
 * values fall back to a conservative default.
 */
const getHistoricalFetchConcurrency = (): number => {
  const configured = Number(process.env.SEC_HISTORICAL_FETCH_CONCURRENCY);
  return Number.isInteger(configured) && configured > 0
    ? configured
    : DEFAULT_HISTORICAL_FETCH_CONCURRENCY;
};

/**
 * Fetches a company's submissions data and follows any referenced older
 * filing-history files, returning every raw columnar filing batch (the
 * "recent" block plus each historical file, in that order). Normalization
 * into `Filing` objects happens separately in `filings.ts`.
 */
export const fetchSubmissionsColumnar = async (cik: string): Promise<RawFilingsColumnar[]> => {
  const submissions = await fetchSecJson<RawSubmissionsResponse>(buildSubmissionsUrl(cik));
  const historicalFiles = submissions.filings.files ?? [];
  const limit = pLimit(getHistoricalFetchConcurrency());

  const historicalBatches = await Promise.all(
    historicalFiles.map((file) =>
      limit(() => fetchSecJson<RawFilingsColumnar>(buildHistoricalFileUrl(file.name))),
    ),
  );

  return [submissions.filings.recent, ...historicalBatches];
};
