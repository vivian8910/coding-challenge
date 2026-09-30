import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';

const renderAt = (path: string) => {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
};

describe('App routing', () => {
  it('renders the home page at /', () => {
    renderAt('/');

    expect(screen.getByRole('heading', { name: /sec edgar filing explorer/i })).toBeInTheDocument();
  });

  it('renders the companies page at /companies', () => {
    renderAt('/companies');

    expect(screen.getByRole('heading', { name: /companies/i })).toBeInTheDocument();
  });

  it('renders the company filings page at /companies/:ticker/filings', () => {
    renderAt('/companies/AAPL/filings');

    expect(screen.getByRole('heading', { name: /filings for/i })).toBeInTheDocument();
  });

  it('renders the summary page at /summary', () => {
    renderAt('/summary');

    expect(screen.getByRole('heading', { name: /filing summary/i })).toBeInTheDocument();
  });
});
