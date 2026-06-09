# Internship Tracker

Internship Tracker is a Chrome extension I built a while ago that watches a Gmail inbox, classifies internship-related emails, extracts status updates, and writes them into a Google Sheet.

## Overview

The project is split into two parts:

- `chrome-extension/`: Chrome extension popup, background worker, and extension build configuration.
- `backend-flask/`: Flask API for authentication, persistence, classification, extraction, and payments.

## Repository layout

- `backend-flask/app/api/`: API routes.
- `backend-flask/app/models/`: Mongo-backed data models.
- `backend-flask/app/classification/`: Saved classification artifacts.
- `chrome-extension/src/`: React popup UI and extension source code.
- `chrome-extension/images/`: Extension icons and assets.
- `.github/workflows/`: Deployment workflows.

## Backend setup

1. Create `backend-flask/.env` from `backend-flask/.env.example`.
2. Install dependencies:

```bash
cd backend-flask
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

3. Run the API:

```bash
python manage.py
```

The backend listens on port `5000` by default.

## Extension setup

1. Create `chrome-extension/.env` from `chrome-extension/.env.example`.
2. Install dependencies and build:

```bash
cd chrome-extension
npm install
npm run build
```

3. Load the unpacked extension from `chrome-extension/` in Chrome developer mode.

## Notes

- The extension uses Gmail and Google Sheets APIs.
- The backend expects MongoDB plus environment-based configuration for external services.
- Build artifacts for the extension are generated locally.
