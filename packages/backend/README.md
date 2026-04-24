# SkyCommands Backend

HTTP API for the **SkyCommands** project. Maintains the device registry, dispatches commands via Firebase Cloud Messaging (FCM) and delivers the responses to the frontend. For an overview of the whole system (backend + Flutter SDK + frontend) see the [root README](../../README.md).

This package (`@skycommands/backend`) is Node.js + Express + SQLite, with TypeScript executed in dev via `tsx`.

## Endpoints

All routes require authentication (Basic for the frontend, Bearer for the Flutter SDK — see [Authentication](#authentication)).

### Devices (`/devices`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/devices` | Lists devices. Accepts query-string filters. |
| `POST` | `/devices` | Registers a new device. Body: `{ fcmToken, udid }`. Returns a random `code` that identifies the device. |
| `POST` | `/devices/heartbeat` | Marks the device as seen. Body: `{ udid }`. |
| `DELETE` | `/devices/:code` | Removes a device. |
| `PUT` | `/devices/:code/metadata` | Updates the device's `metadata` field (free-form JSON). |

### Commands (`/commands`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/commands/execute` | Sends a command to the device and waits for its response. Body: `{ deviceCode, command, payload?, timeout?, retries? }`. |
| `POST` | `/commands/result` | Called by the Flutter SDK when it finishes running a command. Body: `{ commandId, result }`. |
| `POST` | `/commands/ping` | Shortcut: sends a `command: "ping"`. Body: `{ code }`. |

## Authentication

The middleware in `core/auth.ts` accepts two schemes based on the `Authorization` header:

- **`Basic <base64(user:pass)>`** — for the web frontend. Compared against `AUTH_USERNAME` / `AUTH_PASSWORD`.
- **`Bearer <token>`** — for the Flutter SDK. Compared against `APP_KEY`.

If none of the three variables are defined, auth is disabled (only useful for isolated local testing).

## Logging

File-based logging system rotated daily, in JSON Lines format (`core/logger.ts`):

- `logs/commands/YYYY-MM-DD.log` — every command sent and its response (`event: "sent" | "result"`).
- `logs/errors/YYYY-MM-DD.log` — internal errors (FCM, DB, scheduler, etc.).

The directory can be changed with the `LOGS_DIR` variable (default `./logs`). A daily cron in `core/scheduler.ts` deletes files older than 10 days.

### Requirements

- Node.js 25+ (production uses Node 25 alpine).
- A Firebase project with Cloud Messaging enabled.

### Production build

```bash
cd packages/backend
npm run build      # tsc + tsc-alias → ./dist
node dist/index.js
```

The `Dockerfile` runs that build and starts with `node index.js`. Deployment is automated from `.github/workflows/deploy-backend.yml`, which mounts as volumes:

- `database.db` (SQLite persistence)
- `serviceAccountKey.json` (Firebase credentials)
- `logs/` (daily logs)

## Environment variables

| Variable | Description |
|---|---|
| `AUTH_USERNAME` | Basic Auth username (web frontend). |
| `AUTH_PASSWORD` | Basic Auth password. |
| `APP_KEY` | Bearer Auth token for the Flutter SDK. |
| `LOGS_DIR` | Directory where logs are written (default `./logs`). |
