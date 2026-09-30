import { useNavigate } from 'react-router-dom';
import { CompanySearchCombobox } from './CompanySearchCombobox';

type CompanySwitcherProps = {
  setCompanyName?: (name: string) => void;
};

/**
 * Search-driven combobox for jumping straight from one company's filings
 * page to another's, without going back through the Companies list.
 * Navigates to `/companies/:ticker/filings` on selection.
 */
export const CompanySwitcher = ({ setCompanyName }: CompanySwitcherProps) => {
  const navigate = useNavigate();

  const selectCompany = (ticker: string, companyName: string) => {
    setCompanyName?.(companyName);
    navigate(`/companies/${ticker}/filings`);
  };

  return (
    <CompanySearchCombobox
      id="company-switcher"
      label="Switch company"
      onSelect={(company) => selectCompany(company.ticker, company.name)}
      widthClassName="w-64"
    />
  );
};
