import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CompanySwitcher } from '../components/CompanySwitcher';
import { PaginationControls } from '../components/PaginationControls';
import { useCompanyFilings } from '../hooks/useCompanyFilings';

type CompanyFilingsLocationState = {
  companyName?: string;
};

/**
 * Company filings page: filterable, sortable, paginated filings table for a
 * ticker resolved from the route, with explicit loading/empty/error states.
 * Each row links out to the original SEC filing document in a new tab.
 */
export const CompanyFilingsPage = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const location = useLocation();
  const initialCompanyName = (location.state as CompanyFilingsLocationState | null)?.companyName ?? '';
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const {
    company,
    filings,
    pagination,
    availableForms,
    isLoading,
    error,
    notFound,
    form,
    setForm,
    sort,
    setSort,
    offset,
    goToNextPage,
    goToPreviousPage,
  } = useCompanyFilings(ticker);

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/companies"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
          >
            Back to companies
          </Link>
          <h1 className="mt-3 text-2xl font-semibold">
            Filings for {companyName || company?.name}
          </h1>
        </div>
        <CompanySwitcher setCompanyName={setCompanyName} />
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="form-filter" className="block text-sm font-medium text-slate-700">
            Filter by form type
          </label>
          <select
            id="form-filter"
            value={form}
            onChange={(event) => setForm(event.target.value)}
            className="mt-1 w-48 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">All types</option>
            {availableForms.map((formType) => (
              <option key={formType} value={formType}>
                {formType}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sort-direction" className="block text-sm font-medium text-slate-700">
            Sort by filing date
          </label>
          <select
            id="sort-direction"
            value={sort}
            onChange={(event) => setSort(event.target.value as 'asc' | 'desc')}
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        {isLoading && <p className="text-sm text-slate-500">Loading filings…</p>}

        {!isLoading && notFound && (
          <p role="alert" className="text-sm text-red-600">
            No company found for ticker "{ticker}".
          </p>
        )}

        {!isLoading && !notFound && error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {!isLoading && !notFound && !error && filings.length === 0 && (
          <p className="text-sm text-slate-500">No filings found.</p>
        )}

        {!isLoading && !notFound && !error && filings.length > 0 && (
          <>
            <table className="w-full border-collapse overflow-hidden rounded-md border border-slate-200 text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 font-medium text-slate-700">Form</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Filing date</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Report date</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Document</th>
                </tr>
              </thead>
              <tbody>
                {filings.map((filing) => (
                  <tr
                    key={filing.accessionNumber}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-3 py-2 font-medium text-slate-900">{filing.form}</td>
                    <td className="px-3 py-2 text-slate-600">{filing.filingDate}</td>
                    <td className="px-3 py-2 text-slate-600">{filing.reportDate}</td>
                    <td className="px-3 py-2">
                      <a
                        href={filing.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-900 underline-offset-2 hover:underline"
                      >
                        View on SEC.gov
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <PaginationControls
              pagination={pagination}
              offset={offset}
              itemLabel="filings"
              onPrevious={goToPreviousPage}
              onNext={goToNextPage}
            />
          </>
        )}
      </div>
    </section>
  );
};
