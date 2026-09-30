import type { Company } from '@sec-edgar/shared';
import { useState } from 'react';
import { useCompanySearch } from '../hooks/useCompanySearch';

export type CompanySearchComboboxProps = {
  id: string;
  label: string;
  onSelect: (company: Company) => void;
  excludeTickers?: string[];
  widthClassName?: string;
  emptyMessage?: string;
};

/**
 * Shared company search combobox used by company navigation and selection flows.
 */
export const CompanySearchCombobox = ({
  id,
  label,
  onSelect,
  excludeTickers = [],
  widthClassName = 'w-64',
  emptyMessage = 'No matching companies.',
}: CompanySearchComboboxProps) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { results, isLoading, error } = useCompanySearch(query);

  const selectableResults = results.filter((company) => !excludeTickers.includes(company.ticker));
  const showDropdown = isOpen && query.trim().length > 0;
  const resultsId = `${id}-results`;

  const selectCompany = (company: Company) => {
    onSelect(company);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${widthClassName}`}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type="search"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={resultsId}
        autoComplete="off"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          // Deferred so a click on a result registers before the list closes.
          setTimeout(() => setIsOpen(false), 150);
        }}
        placeholder="Search ticker or company name"
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />

      {showDropdown && (
        <ul
          id={resultsId}
          role="listbox"
          className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white text-sm shadow-lg"
        >
          {isLoading && <li className="px-3 py-2 text-slate-500">Searching…</li>}

          {!isLoading && error && (
            <li role="alert" className="px-3 py-2 text-red-600">
              {error}
            </li>
          )}

          {!isLoading && !error && selectableResults.length === 0 && (
            <li className="px-3 py-2 text-slate-500">{emptyMessage}</li>
          )}

          {!isLoading &&
            !error &&
            selectableResults.map((company) => (
              <li key={company.ticker} role="option" aria-selected="false">
                <button
                  type="button"
                  onMouseDown={(event) => {
                    // Prevents the input's onBlur from closing the list before this click registers.
                    event.preventDefault();
                    selectCompany(company);
                  }}
                  className="block w-full px-3 py-2 text-left hover:bg-slate-100"
                >
                  <span className="font-medium text-slate-900">{company.ticker}</span>{' '}
                  <span className="text-slate-600">{company.name}</span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};
