import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCompanies } from '../api/companies';
import { CompanyMultiSelect } from './CompanyMultiSelect';

vi.mock('../api/companies', () => ({
  getCompanies: vi.fn(),
}));

const mockedGetCompanies = vi.mocked(getCompanies);

const aapl = { ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.' };
const msft = { ticker: 'MSFT', cik: '0000789019', name: 'Microsoft Corp' };

const renderMultiSelect = (
  selectedCompanies = [] as typeof aapl[],
  onAdd = vi.fn(),
  onRemove = vi.fn(),
) => {
  render(
    <CompanyMultiSelect
      selectedCompanies={selectedCompanies}
      onAdd={onAdd}
      onRemove={onRemove}
    />,
  );
  return { onAdd, onRemove };
};

describe('CompanyMultiSelect', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows no chips when nothing is selected', () => {
    renderMultiSelect();

    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });

  it('renders a chip per selected company with a remove control', () => {
    renderMultiSelect([aapl, msft]);

    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('MSFT')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove aapl/i })).toBeInTheDocument();
  });

  it('calls onRemove when a chip remove button is clicked', async () => {
    const user = userEvent.setup();
    const { onRemove } = renderMultiSelect([aapl]);

    await user.click(screen.getByRole('button', { name: /remove aapl/i }));

    expect(onRemove).toHaveBeenCalledWith('AAPL');
  });

  it('calls onAdd and clears the query when a search result is selected', async () => {
    mockedGetCompanies.mockResolvedValue({
      companies: [msft],
      pagination: { offset: 0, limit: 8, total: 1, hasNext: false },
    });
    const user = userEvent.setup();
    const { onAdd } = renderMultiSelect();

    const input = screen.getByLabelText(/add companies to compare/i);
    await user.type(input, 'micro');
    const option = await screen.findByRole('button', { name: /msft/i });

    await user.click(option);

    expect(onAdd).toHaveBeenCalledWith(msft);
    expect(input).toHaveValue('');
  });

  it('excludes already-selected companies from the dropdown results', async () => {
    mockedGetCompanies.mockResolvedValue({
      companies: [aapl, msft],
      pagination: { offset: 0, limit: 8, total: 2, hasNext: false },
    });
    const user = userEvent.setup();

    renderMultiSelect([aapl]);

    const input = screen.getByLabelText(/add companies to compare/i);
    await user.type(input, 'a');

    expect(await screen.findByRole('option', { name: /msft/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /aapl/i })).not.toBeInTheDocument();
  });
});
