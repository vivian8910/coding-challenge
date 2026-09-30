import { Link } from 'react-router-dom';
import { PaginationControls } from '../components/PaginationControls';
import { useCompanies } from '../hooks/useCompanies';

/**
 * Companies page: debounced search over ticker/name, a paginated results
 * table, and explicit loading/empty/error states. Each row links to that
 * company's filings page.
 */
export const CompaniesPage = () => {
  const {
    companies,
    pagination,
    isLoading,
    error,
    search,
    setSearch,
    offset,
    goToNextPage,
    goToPreviousPage,
  } = useCompanies();

  return (
    <section>
      <h1 className="text-2xl font-semibold">Companies</h1>

      <label htmlFor="company-search" className="mt-4 block text-sm font-medium text-slate-700">
        Search by ticker or company name
      </label>
      <input
        id="company-search"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="e.g. AAPL or Apple"
        className="mt-1 w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />

      <div className="mt-4">
        {isLoading && <p className="text-sm text-slate-500">Loading companies…</p>}

        {!isLoading && error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {!isLoading && !error && companies.length === 0 && (
          <p className="text-sm text-slate-500">No companies found.</p>
        )}

        {!isLoading && !error && companies.length > 0 && (
          <>
            <table className="w-full border-collapse overflow-hidden rounded-md border border-slate-200 text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 font-medium text-slate-700">Ticker</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Name</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.ticker} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <Link
                        to={`/companies/${company.ticker}/filings`}
                        state={{ companyName: company.name }}
                        className="font-medium text-slate-900 underline-offset-2 hover:underline"
                      >
                        {company.ticker}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{company.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <PaginationControls
              pagination={pagination}
              offset={offset}
              itemLabel="companies"
              onPrevious={goToPreviousPage}
              onNext={goToNextPage}
            />
          </>
        )}
      </div>
    </section>
  );
};
