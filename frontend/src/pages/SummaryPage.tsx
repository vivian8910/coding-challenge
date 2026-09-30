import { CompanyMultiSelect } from '../components/CompanyMultiSelect';
import { useFilingsSummary } from '../hooks/useFilingsSummary';

/**
 * Summary page: a searchable multi-select for choosing companies to
 * compare, a "Compare" action, and a table of trailing-12-month filing
 * counts by form plus latest 10-K date per company. Per-ticker failures
 * from the backend's `errors` array are shown alongside any successful
 * results rather than replacing them.
 */
export const SummaryPage = () => {
  const {
    selectedCompanies,
    addCompany,
    removeCompany,
    compare,
    result,
    isLoading,
    error,
    hasCompared,
  } = useFilingsSummary();

  const formTypes = Array.from(
    new Set(result?.companies.flatMap((company) => Object.keys(company.filingsByForm)) ?? []),
  ).sort();

  return (
    <section>
      <h1 className="text-2xl font-semibold">Filing Summary</h1>
      <p className="mt-1 text-sm text-slate-600">
        Compare filing activity for multiple companies over the previous 12 months.
      </p>

      <div className="mt-4">
        <CompanyMultiSelect
          selectedCompanies={selectedCompanies}
          onAdd={addCompany}
          onRemove={removeCompany}
        />
      </div>

      <button
        type="button"
        onClick={compare}
        disabled={selectedCompanies.length === 0 || isLoading}
        className="mt-4 rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Compare
      </button>

      <div className="mt-6">
        {isLoading && <p className="text-sm text-slate-500">Loading summary…</p>}

        {!isLoading && error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {!isLoading && !error && hasCompared && result && result.errors && result.errors.length > 0 && (
          <ul className="mb-3 space-y-1" role="alert">
            {result.errors.map((summaryError) => (
              <li key={summaryError.ticker} className="text-sm text-red-600">
                {summaryError.ticker}: {summaryError.message}
              </li>
            ))}
          </ul>
        )}

        {!isLoading && !error && hasCompared && result && result.companies.length === 0 && (
          <p className="text-sm text-slate-500">No summary results to display.</p>
        )}

        {!isLoading && !error && hasCompared && result && result.companies.length > 0 && (
          // Companies are columns and metrics (form types, latest 10-K) are
          // rows: the row count is data-driven and can exceed the viewport
          // height, so the table scrolls vertically within its own
          // container (with a sticky header) instead of overflowing the
          // page. It still scrolls horizontally as a fallback for a large
          // number of selected companies.
          <div className="max-h-[28rem] overflow-auto rounded-md border border-slate-200">
            <table className="w-full min-w-max border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-slate-100">
                <tr>
                  <th className="whitespace-nowrap px-3 py-2 font-medium text-slate-700">Metric</th>
                  {result.companies.map((company) => (
                    <th
                      key={company.ticker}
                      className="whitespace-nowrap px-3 py-2 font-medium text-slate-700"
                    >
                      {company.ticker} <span className="font-normal text-slate-500">({company.name})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {formTypes.map((form) => (
                  <tr key={form} className="border-t border-slate-200 hover:bg-slate-50">
                    <th
                      scope="row"
                      className="whitespace-nowrap px-3 py-2 text-left font-medium text-slate-900"
                    >
                      {form}
                    </th>
                    {result.companies.map((company) => (
                      <td key={company.ticker} className="whitespace-nowrap px-3 py-2 text-slate-600">
                        {company.filingsByForm[form] ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-slate-200 hover:bg-slate-50">
                  <th
                    scope="row"
                    className="whitespace-nowrap px-3 py-2 text-left font-medium text-slate-900"
                  >
                    Latest 10-K
                  </th>
                  {result.companies.map((company) => (
                    <td key={company.ticker} className="whitespace-nowrap px-3 py-2 text-slate-600">
                      {company.latest10K ?? '—'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
