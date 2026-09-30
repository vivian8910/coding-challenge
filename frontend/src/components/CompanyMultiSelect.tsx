import type { Company } from '@sec-edgar/shared';
import { CompanySearchCombobox } from './CompanySearchCombobox';

export type CompanyMultiSelectProps = {
  selectedCompanies: Company[];
  onAdd: (company: Company) => void;
  onRemove: (ticker: string) => void;
};

/**
 * Searchable multi-select for building a set of companies to compare: a
 * combobox (reusing `useCompanySearch`) adds companies to a chip list,
 * each individually removable. Already-selected companies are omitted
 * from the dropdown to prevent duplicate selection.
 */
export const CompanyMultiSelect = ({
  selectedCompanies,
  onAdd,
  onRemove,
}: CompanyMultiSelectProps) => {
  const selectCompany = (company: Company) => onAdd(company);

  return (
    <div>
      <CompanySearchCombobox
        id="summary-company-search"
        label="Add companies to compare"
        onSelect={selectCompany}
        excludeTickers={selectedCompanies.map((company) => company.ticker)}
        widthClassName="w-80"
      />

      {selectedCompanies.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {selectedCompanies.map((company) => (
            <li
              key={company.ticker}
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-sm"
            >
              <span className="font-medium text-slate-900">{company.ticker}</span>
              <button
                type="button"
                onClick={() => onRemove(company.ticker)}
                aria-label={`Remove ${company.ticker}`}
                className="text-slate-500 hover:text-slate-900"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
