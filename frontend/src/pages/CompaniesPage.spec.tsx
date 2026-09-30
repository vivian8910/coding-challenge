import type { CompaniesResponse } from '@sec-edgar/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCompanies } from '../api/companies';
import { ApiError } from '../api/client';
import { CompaniesPage } from './CompaniesPage';

vi.mock('../api/companies', () => ({
  getCompanies: vi.fn(),
}));

const mockedGetCompanies = vi.mocked(getCompanies);

const renderPage = () =>
  render(
    <MemoryRouter>
      <CompaniesPage />
    </MemoryRouter>,
  );

const buildResponse = (overrides: Partial<CompaniesResponse> = {}): CompaniesResponse => ({
  companies: [{ ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.' }],
  pagination: { offset: 0, limit: 10, total: 1, hasNext: false },
  ...overrides,
});

describe('CompaniesPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state before the response resolves', () => {
    mockedGetCompanies.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText(/loading companies/i)).toBeInTheDocument();
  });

  it('renders the company list and links to the filings page', async () => {
    mockedGetCompanies.mockResolvedValue(
      buildResponse({ pagination: { offset: 10, limit: 10, total: 25, hasNext: true } }),
    );

    renderPage();

    expect(await screen.findByRole('link', { name: 'AAPL' })).toHaveAttribute(
      'href',
      '/companies/AAPL/filings',
    );
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
  });

  it('shows an empty state when there are no results', async () => {
    mockedGetCompanies.mockResolvedValue(buildResponse({ companies: [], pagination: { offset: 0, limit: 10, total: 0, hasNext: false } }));

    renderPage();

    expect(await screen.findByText(/no companies found/i)).toBeInTheDocument();
  });

  it('shows an error message when the request fails', async () => {
    mockedGetCompanies.mockRejectedValue(new ApiError(500, 'An unexpected error occurred.'));

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('An unexpected error occurred.');
  });

  it('re-fetches with the search term after the user types', async () => {
    mockedGetCompanies.mockResolvedValue(buildResponse());
    const user = userEvent.setup();

    renderPage();
    await screen.findByRole('link', { name: 'AAPL' });

    await user.type(screen.getByLabelText(/search by ticker or company name/i), 'AAPL');

    await waitFor(() => {
      expect(mockedGetCompanies).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'AAPL', offset: 0 }),
      );
    });
  });
});
