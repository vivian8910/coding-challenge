import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCompanies } from '../api/companies';
import { getFilingsSummary } from '../api/summary';
import { SummaryPage } from './SummaryPage';

vi.mock('../api/companies', () => ({
  getCompanies: vi.fn(),
}));

vi.mock('../api/summary', () => ({
  getFilingsSummary: vi.fn(),
}));

const mockedGetCompanies = vi.mocked(getCompanies);
const mockedGetFilingsSummary = vi.mocked(getFilingsSummary);

const aapl = { ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.' };

const selectCompany = async (user: ReturnType<typeof userEvent.setup>) => {
  mockedGetCompanies.mockResolvedValue({
    companies: [aapl],
    pagination: { offset: 0, limit: 8, total: 1, hasNext: false },
  });

  await user.type(screen.getByLabelText(/add companies to compare/i), 'apple');
  await user.click(await screen.findByRole('button', { name: /aapl/i }));
};

describe('SummaryPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('disables the compare button until a company is selected', () => {
    render(<SummaryPage />);

    expect(screen.getByRole('button', { name: /compare/i })).toBeDisabled();
  });

  it('fetches and renders a comparison table after selecting a company and comparing', async () => {
    const user = userEvent.setup();
    mockedGetFilingsSummary.mockResolvedValue({
      companies: [
        {
          cik: '0000320193',
          name: 'Apple Inc.',
          ticker: 'AAPL',
          filingsByForm: { '10-K': 1, '8-K': 3 },
          latest10K: '2024-01-05',
        },
      ],
    });

    render(<SummaryPage />);
    await selectCompany(user);

    const compareButton = screen.getByRole('button', { name: /compare/i });
    expect(compareButton).toBeEnabled();
    await user.click(compareButton);

    expect(await screen.findByRole('columnheader', { name: /aapl/i })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: '10-K' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: '8-K' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: /latest 10-k/i })).toBeInTheDocument();
    expect(screen.getByText('2024-01-05')).toBeInTheDocument();
    expect(mockedGetFilingsSummary).toHaveBeenCalledWith(['AAPL']);
  });

  it('shows per-ticker errors from the response without hiding successful results', async () => {
    const user = userEvent.setup();
    mockedGetFilingsSummary.mockResolvedValue({
      companies: [],
      errors: [{ ticker: 'AAPL', message: 'Unknown ticker: AAPL' }],
    });

    render(<SummaryPage />);
    await selectCompany(user);
    await user.click(screen.getByRole('button', { name: /compare/i }));

    expect(await screen.findByText(/unknown ticker: aapl/i)).toBeInTheDocument();
  });

  it('shows a general error message when the request fails entirely', async () => {
    const user = userEvent.setup();
    mockedGetFilingsSummary.mockRejectedValue(new Error('boom'));

    render(<SummaryPage />);
    await selectCompany(user);
    await user.click(screen.getByRole('button', { name: /compare/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to load summary/i);
  });
});
