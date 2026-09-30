import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Layout } from './Layout';

describe('Layout', () => {
  it('renders the app title and primary navigation links', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Layout>
          <p>Page content</p>
        </Layout>
      </MemoryRouter>,
    );

    expect(screen.getByText('SEC EDGAR Filing Explorer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Companies' })).toHaveAttribute('href', '/companies');
    expect(screen.getByRole('link', { name: 'Summary' })).toHaveAttribute('href', '/summary');
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('marks the companies list route link', () => {
    render(
      <MemoryRouter initialEntries={['/companies']}>
        <Layout>
          <p>Page content</p>
        </Layout>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Companies' })).toHaveClass('bg-slate-900');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveClass('bg-slate-900');
  });

  it('does not mark companies as active on a nested filings route', () => {
    render(
      <MemoryRouter initialEntries={['/companies/AAPL/filings']}>
        <Layout>
          <p>Page content</p>
        </Layout>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Companies' })).not.toHaveClass('bg-slate-900');
  });
});
