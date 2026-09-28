# VI Sweets Admin

Secure web administration panel for VI Sweets. This repository contains the
admin UI and integration boundaries; production credentials belong in the
deployment secret manager and must never be committed.

## Planned integrations

- Firebase Auth/Firestore/FCM for the existing user and notification systems.
- Supabase for the existing voice-message, chat, and online-cricket features.
- GitHub/jsDelivr for versioned public remote sounds and configuration.
- Server-side actions for GitHub writes and privileged data operations.

The current dashboard is an integration-safe UI scaffold. Connect each module
to the existing rules and APIs before enabling destructive or user-affecting
actions.

## Run locally

```bash
npm install
npm run dev
```
