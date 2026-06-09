# Internship Tracker

Internship Tracker is a Chrome extension plus Flask backend that watches a Gmail inbox, classifies internship-related emails, extracts status updates, and writes them into a Google Sheet.

## Repository layout

- `chrome-extension/`: Manifest V3 extension, popup UI, and service worker.
- `backend-flask/`: Flask API for auth, persistence, classification, extraction, and payments.
- `.github/workflows/`: Deployment workflow for the production backend.

## What changed in this cleanup

- Removed tracked `.env` files from source control and replaced them with `.env.example` files.
- Moved extension secrets and deployment-specific values behind environment variables.
- Replaced cookie-based JWT handling in the extension with header-based token storage in `chrome.storage.local`.
- Split the Chrome service worker into focused modules for auth, Gmail polling, backend access, and sheet updates.
- Added a tracked manifest template and a build step that generates `chrome-extension/manifest.json` locally.

## Backend setup

1. Create `backend-flask/.env` from `backend-flask/.env.example`.
2. Fill in:
   - `MONGO_URI`
   - `JWT_SECRET_KEY`
   - `OPENAI_API_KEY`
   - `ORGANIZATION`
   - `PROJECT`
   - `STRIPE_SECRET_KEY`
   - `CORS_ALLOWED_ORIGINS`
3. Install dependencies:

```bash
cd backend-flask
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

4. Run the API:

```bash
python manage.py
```

The backend listens on port `5000` by default.

## Extension setup

1. Create `chrome-extension/.env` from `chrome-extension/.env.example`.
2. Fill in:
   - `EXTENSION_API_BASE_URL`
   - `GOOGLE_OAUTH_CLIENT_ID`
   - `GMAIL_POLL_INTERVAL_MINUTES`
3. Install dependencies and build:

```bash
cd chrome-extension
npm install
npm run build
```

4. Load the unpacked extension from `chrome-extension/` in Chrome developer mode.

The build generates:

- `chrome-extension/manifest.json`
- `chrome-extension/dist/`

Both are local build artifacts and are intentionally ignored by git.

## Security notes

- Do not commit `.env` files.
- The extension manifest is generated locally so the Google OAuth client ID does not live in the repository.
- Backend JWTs are now sent through `Authorization` headers instead of writable browser cookies.
- Restrict `CORS_ALLOWED_ORIGINS` to the deployment origins you actually need.

## Operational notes

- Gmail polling is controlled with `GMAIL_POLL_INTERVAL_MINUTES`.
- The extension expects the backend to expose the Flask routes under `/auth`, `/protected/user`, `/protected/inference`, `/protected/extract`, and `/protected/payment`.
- The OpenAI and Stripe integrations fail fast if their keys are missing instead of partially booting with invalid configuration.
