import type { Filing } from '@sec-edgar/shared';
import { buildFilingUrl } from './filing-url';
import type { RawFilingsColumnar } from './submissions';

const COLUMNS = ['accessionNumber', 'filingDate', 'reportDate', 'form', 'primaryDocument'] as const;

/**
 * SEC submissions use columnar arrays where the same index represents the
 * same filing. If a batch's arrays disagree on length, the response cannot
 * be safely mapped index-by-index, so it is treated as invalid rather than
 * silently defaulted or inferred.
 */
const assertEqualLengths = (batch: RawFilingsColumnar): number => {
  const lengths = COLUMNS.map((column) => batch[column].length);
  const [first, ...rest] = lengths;

  if (rest.some((length) => length !== first)) {
    throw new Error(
      `Invalid SEC submissions response: columnar arrays have mismatched lengths (${COLUMNS.map(
        (column, i) => `${column}=${lengths[i]}`,
      ).join(', ')})`,
    );
  }

  return first;
};

const toFiling = (cik: string, batch: RawFilingsColumnar, index: number): Filing => {
  const accessionNumber = batch.accessionNumber[index];
  const primaryDocument = batch.primaryDocument[index];

  return {
    accessionNumber,
    filingDate: batch.filingDate[index],
    reportDate: batch.reportDate[index],
    form: batch.form[index],
    primaryDocument,
    link: buildFilingUrl(cik, accessionNumber, primaryDocument),
  };
};

/**
 * Flattens SEC's raw columnar filing batches (the "recent" block plus any
 * historical files) into normalized `Filing` objects. `cik` must be the
 * company's zero-padded CIK, used to construct each filing's `link`.
 *
 * Throws if any batch's columnar arrays have mismatched lengths, since that
 * indicates the response cannot be reliably mapped index-by-index.
 */
export const normalizeFilings = (cik: string, batches: RawFilingsColumnar[]): Filing[] =>
  batches.flatMap((batch) => {
    const length = assertEqualLengths(batch);
    return Array.from({ length }, (_, index) => toFiling(cik, batch, index));
  });
