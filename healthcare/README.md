# Sahaara Health — local mock-data prototype

The React frontend in `frontend/` now connects by default to the file-backed Express API in `backend/`. **MongoDB is not needed or connected.** Use fictional information only: this is not a production or medical system.

## Run locally

Requires Node.js 20.19+ (or 22.12+).

```bash
# Terminal 1
cd backend
npm ci
npm start

# Terminal 2
cd frontend
npm ci
npm run dev
```

Open the frontend URL and create a fictional account with a test-only password. The API listens on `127.0.0.1:4001`, and the frontend proxies requests to it. Account data and bookmarks persist in `backend/mock-data/store.json`; login sessions reset when the backend restarts. Do not use real personal or medical data.

The hospital map, assistant and report results are labelled simulations. The scanner does not perform OCR or upload selected files. Scheme descriptions are curated samples from official sources, and matches are not guarantees of eligibility.

The self-contained `frontend/preview/index.html` is an offline demo. Restricted file previews cannot reach the account API; use the live website for mock accounts. See `backend/README.md` for privacy, reset and testing instructions. A source-only copy of the former database-backed backend is in `legacy-mongodb-backend/` and is not used by this app.
