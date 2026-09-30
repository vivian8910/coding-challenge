# SEC EDGAR Filing Explorer

Simple full-stack app to browse SEC company filings.

## Prerequisites

- Node.js 20+
- npm 10+

## 1) Install dependencies

From the repository root:

```bash
npm install
```

## 2) Run the app (development)

Open **two terminals** in the repository root.

Terminal 1 (backend API on `http://localhost:3000`):

```bash
npm run dev:backend
```

Terminal 2 (frontend on `http://localhost:5173`):

```bash
npm run dev:frontend
```

Then open:

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:3000/health`

## Optional environment variables

- `SEC_USER_AGENT` (backend): custom User-Agent for SEC EDGAR requests.
- `SEC_REQUEST_TIMEOUT_MS` (backend): request timeout in ms (default `10000`).
- `PORT` (backend): API port (default `3000`).
- `VITE_API_BASE_URL` (frontend): API base URL (default `http://localhost:3000`).

## Run tests

From the repository root:

```bash
npm test
```

