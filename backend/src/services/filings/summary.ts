import type { Filing } from '@sec-edgar/shared';

const MONTHS_IN_WINDOW = 12;
const TEN_K_FORM = '10-K';

/** Formats a UTC date as an ISO calendar date (YYYY-MM-DD), matching SEC's `filingDate` format. */
const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Returns the ISO calendar date exactly 12 months before `now` (UTC),
 * inclusive lower bound for the trailing-12-month filing window. Using UTC
 * calendar math (rather than a fixed day count) keeps the boundary
 * consistent regardless of the server's local timezone.
 */
export const twelveMonthCutoff = (now: Date): string => {
  const cutoff = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - MONTHS_IN_WINDOW, now.getUTCDate()),
  );
  return toIsoDate(cutoff);
};

export type FilingCounts = {
  filingsByForm: Record<string, number>;
  latest10K: string | null;
};

/**
 * Counts filings by form type whose `filingDate` falls within the trailing
 * 12 months (inclusive of the cutoff date), and separately finds the most
 * recent 10-K filing date across the company's full filing history (the
 * 12-month window applies to the per-form counts, not to `latest10K`).
 */
export const summarizeFilings = (filings: Filing[], now: Date = new Date()): FilingCounts => {
  const cutoff = twelveMonthCutoff(now);

  const filingsByForm: Record<string, number> = {};
  let latest10K: string | null = null;

  for (const filing of filings) {
    if (filing.filingDate >= cutoff) {
      filingsByForm[filing.form] = (filingsByForm[filing.form] ?? 0) + 1;
    }

    if (filing.form === TEN_K_FORM && (!latest10K || filing.filingDate > latest10K)) {
      latest10K = filing.filingDate;
    }
  }

  return { filingsByForm, latest10K };
};
