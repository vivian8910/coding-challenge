import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCompanies } from '../api/companies';
import { CompanySwitcher } from './CompanySwitcher';

vi.mock('../api/companies', () => ({
  getCompanies: vi.fn(),
}));

const mockedGetCompanies = vi.mocked(getCompanies);

const FilingsRoute = () => {
  const { ticker } = useParams<{ ticker: string }>();
  return (
    <>
      <p>Viewing {ticker}</p>
      <CompanySwitcher />
    </>
  );
};

const renderSwitcher = () =>
  render(
    <MemoryRouter initialEntries={['/companies/AAPL/filings']}>
      <Routes>
        <Route path="/companies/:ticker/filings" element={<FilingsRoute />} />
      </Routes>
    </MemoryRouter>,
  );

describe('CompanySwitcher', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows no dropdown until the user types a query', () => {
    renderSwitcher();

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows matching companies as the user types', async () => {
    mockedGetCompanies.mockResolvedValue({
      companies: [{ ticker: 'MSFT', cik: '0000789019', name: 'Microsoft Corp' }],
      pagination: { offset: 0, limit: 8, total: 1, hasNext: false },
    });
    const user = userEvent.setup();

    renderSwitcher();
    await user.type(screen.getByLabelText(/switch company/i), 'micro');

    expect(await screen.findByRole('option', { name: /msft/i })).toBeInTheDocument();
  });

  it('shows a no-matches message when nothing is found', async () => {
    mockedGetCompanies.mockResolvedValue({
      companies: [],
      pagination: { offset: 0, limit: 8, total: 0, hasNext: false },
    });
    const user = userEvent.setup();

    renderSwitcher();
    await user.type(screen.getByLabelText(/switch company/i), 'zzz');

    expect(await screen.findByText(/no matching companies/i)).toBeInTheDocument();
  });

  it('navigates to the selected company filings page and clears the query', async () => {
    mockedGetCompanies.mockResolvedValue({
      companies: [{ ticker: 'MSFT', cik: '0000789019', name: 'Microsoft Corp' }],
      pagination: { offset: 0, limit: 8, total: 1, hasNext: false },
    });
    const user = userEvent.setup();

    renderSwitcher();
    const input = screen.getByLabelText(/switch company/i);
    await user.type(input, 'micro');
    const option = await screen.findByRole('button', { name: /msft/i });

    await user.click(option);

    await waitFor(() => expect(screen.getByText(/viewing\s+msft/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByLabelText(/switch company/i)).toHaveValue(''));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
