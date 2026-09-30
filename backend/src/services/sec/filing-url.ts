const EDGAR_ARCHIVES_BASE_URL = 'https://www.sec.gov/Archives/edgar/data';

/**
 * SEC's filing archive directories are keyed by CIK without leading zeros
 * (verified live: the zero-padded form redirects to this one).
 */
const stripLeadingZeros = (cik: string): string => cik.replace(/^0+/, '') || '0';

const stripDashes = (accessionNumber: string): string => accessionNumber.replace(/-/g, '');

/**
 * Builds the canonical URL to the original filing document on `sec.gov`
 * from the zero-padded CIK, accession number, and primary document.
 */
export const buildFilingUrl = (
  cik: string,
  accessionNumber: string,
  primaryDocument: string,
): string =>
  `${EDGAR_ARCHIVES_BASE_URL}/${stripLeadingZeros(cik)}/${stripDashes(accessionNumber)}/${primaryDocument}`;
