import type { PaginatedFilingsResponse } from '@sec-edgar/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import { getCompanyFilings } from '../api/filings';
import { CompanyFilingsPage } from './CompanyFilingsPage';

vi.mock('../api/filings', () => ({
  getCompanyFilings: vi.fn(),
}));

const mockedGetCompanyFilings = vi.mocked(getCompanyFilings);

const renderPage = ({ ticker = 'AAPL', companyName }: { ticker?: string; companyName?: string } = {}) =>
  render(
    <MemoryRouter
      initialEntries={[
        companyName
          ? { pathname: `/companies/${ticker}/filings`, state: { companyName } }
          : `/companies/${ticker}/filings`,
      ]}
    >
      <Routes>
        <Route path="/companies/:ticker/filings" element={<CompanyFilingsPage />} />
      </Routes>
    </MemoryRouter>,
  );

const buildResponse = (
  overrides: Partial<PaginatedFilingsResponse> = {},
): PaginatedFilingsResponse => ({
  company: { ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.' },
  filings: [
    {
      accessionNumber: '0000320193-24-000001',
      filingDate: '2024-01-05',
      reportDate: '2023-12-31',
      form: '10-K',
      primaryDocument: 'aapl-10k.htm',
      link: 'https://www.sec.gov/Archives/edgar/data/320193/000032019324000001/aapl-10k.htm',
    },
  ],
  pagination: { offset: 0, limit: 20, total: 1, hasNext: false },
  availableForms: ['10-K', '10-Q', '8-K'],
  ...overrides,
});

describe('CompanyFilingsPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state before the response resolves', () => {
    mockedGetCompanyFilings.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText(/loading filings/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^filings for$/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /filings for aapl/i })).not.toBeInTheDocument();
  });

  it('shows the company name immediately when passed via navigation state', () => {
    mockedGetCompanyFilings.mockReturnValue(new Promise(() => {}));

    renderPage({ companyName: 'Apple Inc.' });

    expect(screen.getByRole('heading', { name: /filings for apple inc\./i })).toBeInTheDocument();
  });

  it('renders filings with a link to the original SEC document opening in a new tab', async () => {
    mockedGetCompanyFilings.mockResolvedValue(buildResponse());

    renderPage();

    expect(screen.getByRole('link', { name: /back to companies/i })).toHaveAttribute(
      'href',
      '/companies',
    );
    expect(await screen.findByRole('heading', { name: /filings for apple inc\./i })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '10-K' })).toBeInTheDocument();
    expect(screen.getByText('2024-01-05')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /view on sec\.gov/i });
    expect(link).toHaveAttribute(
      'href',
      'https://www.sec.gov/Archives/edgar/data/320193/000032019324000001/aapl-10k.htm',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('shows an empty state when there are no filings', async () => {
    mockedGetCompanyFilings.mockResolvedValue(
      buildResponse({ filings: [], pagination: { offset: 0, limit: 20, total: 0, hasNext: false } }),
    );

    renderPage();

    expect(await screen.findByText(/no filings found/i)).toBeInTheDocument();
  });

  it('shows a not-found message for an unknown ticker', async () => {
    mockedGetCompanyFilings.mockRejectedValue(new ApiError(404, 'Company not found.'));

    renderPage({ ticker: 'NOPE' });

    expect(await screen.findByRole('alert')).toHaveTextContent(/no company found for ticker "nope"/i);
  });

  it('shows a generic error message for other failures', async () => {
    mockedGetCompanyFilings.mockRejectedValue(new ApiError(502, 'SEC EDGAR is currently unavailable.'));

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('SEC EDGAR is currently unavailable.');
  });

  it('populates the form-type dropdown from the response and re-fetches on selection', async () => {
    mockedGetCompanyFilings.mockResolvedValue(buildResponse());
    const user = userEvent.setup();

    renderPage();
    await screen.findByRole('link', { name: /view on sec\.gov/i });

    const formSelect = screen.getByLabelText(/filter by form type/i);
    expect(screen.getByRole('option', { name: 'All types' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '10-K' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '10-Q' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '8-K' })).toBeInTheDocument();

    await user.selectOptions(formSelect, '10-K');

    await waitFor(() => {
      expect(mockedGetCompanyFilings).toHaveBeenLastCalledWith(
        'AAPL',
        expect.objectContaining({ form: '10-K', offset: 0 }),
      );
    });
  });

  it('re-fetches with the selected sort direction', async () => {
    mockedGetCompanyFilings.mockResolvedValue(buildResponse());
    const user = userEvent.setup();

    renderPage();
    await screen.findByRole('link', { name: /view on sec\.gov/i });

    await user.selectOptions(screen.getByLabelText(/sort by filing date/i), 'asc');

    await waitFor(() => {
      expect(mockedGetCompanyFilings).toHaveBeenLastCalledWith(
        'AAPL',
        expect.objectContaining({ sort: 'asc', offset: 0 }),
      );
    });
  });
});
