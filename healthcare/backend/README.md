# Sahaara Health backend — mock data

The active Express backend uses a local JSON file instead of MongoDB. It is for **fictional test data only**, not medical or production use. The frontend labels account sessions **MOCK DATA**. No database connection, database credentials or third-party service keys are required.

## Run

Install Node.js 20.19+ (or 22.12+), then:

```bash
# Terminal 1, backend/
npm ci
npm start

# Terminal 2, frontend/
npm ci
npm run dev
```

The backend binds to `127.0.0.1:4001`; the Vite frontend proxies `/api` there by default. Open Vite's URL and create an account with a fictional name, a test-format 10-digit mobile number, and a test-only password. Do not reuse a real password. `npm run dev` in the backend starts the same server in watch mode; `npm run start:mock` remains an alias for compatibility. To change the port, set `PORT` when starting the backend and set `API_PROXY_TARGET` when starting the frontend. `MOCK_DATA_DIR` optionally chooses a different local storage directory.

## What is connected

- Registration, sign-in, profile editing, account-scoped scheme bookmarks, and opt-in histories use `mock-data/store.json`. On first start the file is created if absent; it is not replaced on restart. Sessions are in memory, so sign in again after a server restart.
- Four curated scheme summaries are supplied by `src/data/schemeSeed.js`. Matching is preliminary, not a guarantee of eligibility.
- Hospital facilities and the map are explicitly fictional. The assistant is simulated, gives general guidance only and does not contact an AI provider. Report output is a fixed fictional example: **no OCR is performed and no selected file or filename is uploaded**.
- The separate offline demo is also labelled. A restricted file viewer may block account APIs; use the live website or open it in a browser tab for the mock backend.

## Data and security

`mock-data/store.json` contains profiles and saved scheme IDs in plaintext and bcrypt-hashed passwords. Opt-in chat and sample-report content is encrypted with keys in `mock-data/keys.json`, stored alongside the data. Permissions are set to owner-only on startup, but keeping the keys beside the data is **not suitable protection for real personal or medical information**. Do not upload or enter real medical information, expose this server to the internet, or reuse real credentials. This mock server refuses `NODE_ENV=production`, supports one process at a time, and has no cross-process locking, migration, backups, verified phone ownership or password recovery. The data directory is gitignored. Saved chats stop appearing after 30 days but their encrypted entries remain in the file until deleted or reset.

To reset all mock accounts and data, stop the server first, then remove the whole `mock-data/` directory. Removing only `keys.json` makes existing encrypted history unreadable. No automatic migration or synchronization with any database is provided. Existing MongoDB data was not modified.

## Tests

`npm test` runs mock API, privacy, startup, persistence and account-isolation tests with temporary files; it requires no MongoDB. `npm run test:mock-ui` exercises a browser workflow with the mock API and Vite. For that test run `npx playwright install --with-deps chromium` (or install equivalent browser and system dependencies) and `npm ci` in `../frontend`. Frontend unit/UI tests run with `npm test` in `../frontend`.

The previous MongoDB implementation is preserved separately as inactive source in `../legacy-mongodb-backend/`; it is not connected, installed, or used by the active backend. See its `ARCHIVED.md` before considering restoration. Reintroducing it would require a deliberate migration and security review.
