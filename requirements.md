# SEC EDGAR Filing Explorer — Initial Plan

## 1. Objective

Build a React and TypeScript application with a Fastify and Node.js backend for exploring SEC EDGAR filing data.

The application must allow users to:

- Browse publicly filing companies.
- Resolve a ticker symbol to its SEC CIK.
- Browse a company's SEC filings.
- Filter filings by form type.
- Sort filings by filing date.
- Paginate filing results.
- Open the original filing on `sec.gov`.
- Compare filing statistics for multiple companies over the previous 12 months.

The requirements in this document are based primarily on `analysis.md`. The additional design guidance from `draft.md` is incorporated where it supports those requirements without weakening them.

## 2. Technology stack

- **Frontend:** React, TypeScript
- **Backend:** Fastify, Node.js, TypeScript
- **External data source:** SEC EDGAR APIs
- **Initial persistence:** No database required
- **Optional optimization:** Small in-memory caches for SEC ticker metadata and submissions responses

## 3. User-facing routes

Implement four frontend routes:

1. **Home page**
   - Explain the purpose of the application.
   - Provide navigation to the companies page.
   - Provide navigation to the summary page.

2. **Companies page**
   - Display a paginated list of companies.
   - Use the `GET /companies` endpoint.
   - Provide a search box for company name or ticker.
   - Show a selectable dropdown/autocomplete with a limited number of results, such as 10, to avoid rendering an unnecessarily large list.
   - Selecting a company navigates to its filings page.

3. **Company filings page**
   - Display the selected company's filings in a paginated table.
   - Use the `GET /companies/:ticker/filings` endpoint.
   - Provide the same company search/selector so users can switch companies without returning to the companies page.
   - Provide form-type filtering.
   - Provide filing-date sorting.
   - Link each filing to its original SEC document.

4. **Summary page**
   - Provide a searchable multi-select company control.
   - Provide a button to compare selected companies.
   - Use the `GET /filings/summary` endpoint.
   - Display each company's filing counts by form type and latest `10-K` filing date.

The frontend should include loading, empty, unknown-company, SEC-unavailable, and general error states.

## 4. Backend API

### 4.1 `GET /companies`

Return company metadata derived from:

```text
https://www.sec.gov/files/company_tickers.json
```

Purpose:

- Populate the companies page.
- Support company search/autocomplete.
- Resolve a ticker to a CIK for other backend operations.

Each company should expose at least:

```ts
type Company = {
  ticker: string;
  cik: string;
  name: string;
};
```

Behavior:

- Support searching by ticker and company name.
- Return a bounded result set for search/autocomplete.
- Normalize ticker input consistently, preferably to uppercase.
- Return CIK values zero-padded to 10 digits.
- Handle duplicate or unknown tickers explicitly.

The endpoint is required for the initial implementation because the frontend company list and selectors depend on it.

### 4.2 `GET /companies/:ticker/filings`

Return a normalized, paginated list of filings for the requested company.

Required query parameters:

- `offset`: zero-based starting position, default `0`
- `limit`: number of records to return, with a safe maximum

Optional query parameters:

- `form`: exact form-type filter, for example `10-K`, `10-Q`, or `8-K`
- `sort`: filing-date direction, for example `asc` or `desc`

The backend must:

1. Normalize the ticker.
2. Resolve it through the company metadata.
3. Fetch the company's SEC submissions data.
4. Follow referenced older filing-history files when needed to support the company's full filing history.
5. Convert SEC's columnar arrays into application filing objects.
6. Apply form filtering.
7. Sort by `filingDate`.
8. Apply `offset` and `limit`.
9. Return pagination metadata and company identity.

Suggested response shape:

```ts
type Filing = {
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  form: string;
  primaryDocument: string;
  link: string;
};

type PaginatedFilingsResponse = {
  company: Company;
  filings: Filing[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
};
```

Implementation notes:

- Preserve the required filing fields where SEC provides them.
- Use the SEC `form` value as the canonical form type. If the application retains the `coreType` name for compatibility with the original analysis, document how it maps to SEC data.
- SEC submissions use columnar arrays where the same index represents the same filing. Validate that all arrays used by the mapper have equal lengths. If they differ, treat the response as invalid. Do not add silent fallbacks, default values or infered values.
- The filing link must point to the original SEC filing document and must be constructed from the zero-padded CIK, accession number, and primary document.
- Sorting must use `filingDate`, not report date or acceptance timestamp.
- Do not return an unbounded filing history.

### 4.3 `GET /filings/summary`

Return filing statistics for selected companies over the previous 12 months.

Request shape:

```text
GET /filings/summary?ticker=AAPL&ticker=SPOT&ticker=JPM
```

The endpoint must:

1. Accept one or more ticker values.
2. Resolve each ticker to a company and CIK.
3. Fetch and normalize the relevant filings.
4. Count filings by form type whose filing date falls within the previous 12 months.
5. Find the date of the latest `10-K`.
6. Return results grouped by company.

Suggested response shape:

```ts
type FilingSummary = {
  cik: string;
  name: string;
  ticker: string;
  filingsByForm: Record<string, number>;
  latest10K: string | null;
};

type SummaryResponse = {
  companies: FilingSummary[];
};
```

One invalid or temporarily unavailable company should not necessarily invalidate successful results for the other selected companies. Errors must remain visible to the frontend.

Define the 12-month boundary consistently using UTC dates and filing dates.

## 5. SEC integration

Create a backend SEC client/service responsible for:

- Fetching `company_tickers.json`.
- Fetching `data.sec.gov/submissions/CIK##########.json`.
- Fetching older filing-history files referenced by submissions responses.
- Applying the required SEC `User-Agent` header.
- Handling non-success responses, malformed payloads, timeouts, and rate limiting.
- Constructing SEC filing URLs.

Keep SEC-specific response formats isolated from the application-facing API. In particular, use an internal type for SEC's columnar submissions representation and map it to the normalized `Company` and `Filing` types.

Use a small in-memory cache where useful:

- Cache ticker metadata for the process lifetime or a reasonable expiration period.
- Cache submissions data briefly to reduce repeated SEC requests.
- Do not introduce persistent infrastructure unless implementation needs demonstrate it.

## 6. Frontend structure

Suggested components:

- Application layout/header/navigation
- Company search/select control
- Filing filters and sorting controls
- Filings table
- Pagination controls
- Summary company multi-select
- Summary comparison table
- Loading, empty, and error-state components

The filings table should show, at minimum:

- Filing date
- Form type
- Report date
- Accession number or primary document
- Link to the SEC filing

A table is preferred for the summary initially because it is easier to inspect and compare than a chart.

## 7. Validation and edge cases

Handle the following explicitly:

- Lowercase, unknown, duplicated, or whitespace-padded tickers.
- CIK values requiring zero-padding.
- Companies with no filings in the requested period.
- Companies without a recent `10-K`.
- Amended forms such as `10-K/A`.
- Unusual or newly introduced SEC form types.
- Missing or mismatched SEC columnar fields.
- Filing date, report date, and acceptance timestamp being different concepts.
- SEC network failures, malformed responses, rate limiting, and unavailable data.
- Large filing histories and safe pagination limits.
- Empty search results and no selected summary companies.

Decide during implementation whether amended forms are:

- Treated as their exact form values, or
- Grouped with their base form for filtering and summary counts.

The initial implementation should use exact form matching unless the product requirements are clarified otherwise.

## 8. Proposed implementation order

1. Set up the TypeScript frontend and Fastify backend.
2. Define shared application types and API response types.
3. Implement the SEC client with headers, normalization helpers, and error handling.
4. Implement company metadata loading and `GET /companies`.
5. Implement submissions retrieval, historical filing-file support, and filing normalization.
6. Implement `GET /companies/:ticker/filings` with filtering, sorting, and offset/limit pagination.
7. Implement `GET /filings/summary`.
8. Build the shared frontend layout and navigation.
9. Build the companies page and company selector.
10. Build the company filings page.
11. Build the summary page.
12. Add loading, empty, and error states across all flows.
13. Add targeted tests for SEC normalization, URL construction, filtering, sorting, pagination, and summary calculations.
14. Run the project’s formatter, type-checker, linter, and relevant test suite.

## 9. Open decisions for plan-mode iteration

- Whether older filing-history files are required for the first milestone or can be added immediately after the basic submissions response works.
- Exact API response envelope and validation library, following the project’s existing conventions.
- Maximum allowed `limit` and default page size.
- Whether `/companies` search is server-side, client-side after loading all ticker metadata, or a combination.
- Whether amended forms should be grouped with their base forms.
- Cache duration and whether cache failures should be visible in logs only or exposed as API errors.
- Whether partial summary results should use HTTP 200 with an `errors` array or a different error strategy.
