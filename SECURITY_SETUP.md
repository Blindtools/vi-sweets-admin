# Secure integration setup

The admin panel never places privileged credentials in browser code. Configure
these as server/deployment secrets:

- `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` — Firebase Admin SDK service-account JSON.
- `GITHUB_TOKEN` — fine-grained token limited to `Blindtools/vi-sweets-remote-assets`
  contents read/write only, or replace this with a GitHub App installation token.

The `/api/admin/publish-json` route requires a Firebase ID token and verifies
the caller against `admin_roles/{uid}` before writing to GitHub. Do not paste
either secret into this repository, an issue, or chat.
