import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CompaniesPage } from './pages/CompaniesPage';
import { CompanyFilingsPage } from './pages/CompanyFilingsPage';
import { HomePage } from './pages/HomePage';
import { SummaryPage } from './pages/SummaryPage';

/** Defines the application's four top-level routes, wrapped in the shared navigation layout. */
const App = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/companies/:ticker/filings" element={<CompanyFilingsPage />} />
        <Route path="/summary" element={<SummaryPage />} />
      </Routes>
    </Layout>
  );
};

export default App;
