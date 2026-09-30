import { describe, expect, it } from 'vitest';
import { buildFilingUrl } from './filing-url';

describe('buildFilingUrl', () => {
  it('strips leading zeros from the CIK and dashes from the accession number', () => {
    const url = buildFilingUrl('0000320193', '0000320193-25-000079', 'aapl-20250927.htm');

    expect(url).toBe(
      'https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/aapl-20250927.htm',
    );
  });

  it('handles a CIK with no leading zeros', () => {
    const url = buildFilingUrl('320193', '0000320193-25-000079', 'aapl-20250927.htm');

    expect(url).toBe(
      'https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/aapl-20250927.htm',
    );
  });

  it('falls back to "0" for an all-zero CIK', () => {
    const url = buildFilingUrl('0000000000', '0000000000-25-000001', 'doc.htm');

    expect(url).toBe('https://www.sec.gov/Archives/edgar/data/0/000000000025000001/doc.htm');
  });
});
