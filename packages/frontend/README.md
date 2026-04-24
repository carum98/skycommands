# SkyCommands Frontend

Web interface for the **SkyCommands** project, a platform for sending remote commands to Flutter devices and viewing the responses. For an overview of the whole system (backend + Flutter SDK + frontend) see the [root README](../../README.md).

This package (`@skycommands/frontend`) is the Vue 3 + Vite SPA that lets an operator authenticate, search for registered devices, run commands against them and view the result.

## Command catalog

The commands available in the UI **are not hardcoded** — they are defined in `public/commands.json`. Each entry includes:

- `name`, `description`, `command` (the identifier the Flutter SDK receives).
- `parameters[]`: fields the UI renders dynamically (`input`, `textarea`, `select`).

To add a new command, just add an object to this file (and, of course, implement it on the Flutter SDK side).

## Authentication

- Basic Auth against the backend. Credentials are base64-encoded and stored in `localStorage` under the `skycommands_auth` key (see `app/composables/useAuth.ts`).
- The router (`app/router/index.ts`) protects routes marked with `meta.requiresAuth` and redirects to `/login` when there's no session.

## Running locally

### Requirements

- Node.js 25+ (production uses Node 25 alpine).
- The backend running on `http://localhost:3000` (see `packages/backend/README`).

### Production build

```bash
cd packages/frontend
npm run build      # outputs ./dist
npm run preview    # serves ./dist locally for verification
```

The `Dockerfile` does exactly that and then serves the static bundle with `serve` on port `8080`. Deployment is automated from `.github/workflows/deploy-frontend.yml`.

## Environment variables

| Variable | Description | Example |
|---|---|---|
| `VITE_BACKEND_URL` | Base URL of the backend that `$fetch` calls hit. In production it's injected as a Docker build `ARG`. | `http://localhost:3000` |
