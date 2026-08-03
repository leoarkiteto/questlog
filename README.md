# Questlog

Personal game collection manager — track games you **want to play/buy**, games you're **currently playing**, and games you've **played** (with 5-star ratings and the platform you played on). No accounts, no auth: it's your app on your machine.

The UI follows a Netflix/YouTube-style mobile layout: dark theme, header + search, horizontal-scrolling rows per list, a featured hero card, and a bottom nav on phones.

## Stack

| Layer    | Tech                                        |
| -------- | ------------------------------------------- |
| Frontend | Next.js 15 (App Router, TypeScript, Tailwind v4) |
| Backend  | Go 1.26 (net/http, pgx)                     |
| Database | PostgreSQL 17                               |

```
gamelog/
├── backend/            Go REST API
│   ├── cmd/server/     entrypoint (env config, migrations, server)
│   └── internal/
│       ├── api/        HTTP handlers + middleware
│       ├── model/      Game model, status enum, validation
│       └── repo/       pgx store + embedded SQL migrations
├── frontend/           Next.js app
│   ├── app/            dashboard, search, library, game form/detail
│   ├── components/     cards, rows, star rating, nav
│   └── lib/            API client + types
├── scripts/seed.sh     sample data
├── docker-compose.yml  Postgres only
└── Makefile
```

## Quick start

```bash
# 1. Postgres (Docker):
docker compose up -d db

# 2. Backend API on :8080 (applies migrations automatically):
make backend

# 3. Frontend on :3000 (new terminal):
make frontend

# optional: fill the dashboard with sample games
make seed
```

Open http://localhost:3000.

## Using it from your phone

The main device is a smartphone. Run the backend on your machine, then point the frontend at your machine's LAN address:

```bash
# in frontend/, before `npm run dev`:
NEXT_PUBLIC_API_URL=http://<your-machine-ip>:8080 npm run dev
```

Open `http://<your-machine-ip>:3000` from the phone (both devices on the same network). The API already allows cross-origin requests for this setup.

## Configuration (backend)

| Env var                | Default                                      | Description            |
| ---------------------- | -------------------------------------------- | ---------------------- |
| `DATABASE_URL`         | `postgres://gamelog@localhost:5432/gamelog`  | Postgres connection    |
| `PORT`                 | `8080`                                       | HTTP listen port       |
| `STEAM_API_KEY`        | *(optional)*                                 | Steam Web API key (kept server-side) |
| `IGDB_CLIENT_ID`       | *(optional)*                                 | Twitch app Client-ID for IGDB covers (see above) |
| `IGDB_CLIENT_SECRET`   | *(optional)*                                 | Twitch app Client Secret for IGDB |

**Secrets live in `backend/.env`** (gitignored, never committed). Copy the template and fill it in:

```bash
cp backend/.env.example backend/.env
# edit backend/.env → paste your STEAM_API_KEY / IGDB_CLIENT_ID / IGDB_CLIENT_SECRET
make backend
```

The backend loads `backend/.env` automatically on startup; real shell env vars always take precedence over the file. `.env.example` is the documented template (tracked in git).

The Docker compose db uses user/password `gamelog` / `gamelog`, database `gamelog`. Without Docker, any Postgres works — just adjust `DATABASE_URL` (migrations run automatically on startup).

## Steam integration

Getting covers and info from Steam is built into the flow:

- **New / edit form:** start typing a title and catalog matches appear automatically under the field (500ms debounce) — tap one and Questlog fills the cover, year, genre, platform, and description, and links the game to its catalog id. There's a live cover preview in the form. Fields you already filled (e.g. a Switch platform) are kept.
- **Detail page:** the **Get cover online** button enriches any existing entry with cover + metadata — rating, status, and notes are preserved. When there's no exact title match it picks the closest IGDB match (and tells you which one it chose).

## Non-Steam games (PS5, Switch, …)

Games not on Steam are covered by **IGDB** (api.igdb.com), the cross-platform game database. It needs free Twitch app credentials:

1. Create an app at https://dev.twitch.tv/console/apps (any name; "Confidential" client type).
2. Copy the **Client-ID** and generate a **Client Secret**.
3. Pass them to the backend:

```bash
IGDB_CLIENT_ID=xxxx IGDB_CLIENT_SECRET=yyyy make backend
```

The backend handles the Twitch OAuth token (fetched server-side, cached, refreshed automatically) — the browser never sees your credentials. Without credentials the app still works (Steam covers + manual entry); IGDB simply stays disabled.

All catalog calls are proxied through the Go backend (`GET /api/catalog/search?q=`, `GET /api/catalog/app/{source}/{appid}`, `source` = `steam` | `igdb`). Steam covers use Steam's portrait library art (`library_600x900.jpg`); IGDB covers use portrait box art (`t_cover_big_2x`) — both fit the 2:3 cards.

## Data model

`games`:

| Field       | Notes                                              |
| ----------- | -------------------------------------------------- |
| `status`    | `wishlist` · `playing` · `played`                  |
| `rating`    | 0 (unrated) .. 5 stars — set when you've played it |
| `platform`  | the platform you played on (PC, Switch, …)         |
| `year`/`genre`/`cover_url`/`description`/`notes` | metadata, description usually from Steam |
| `steam_appid` | Steam app id when the game was linked via Steam  |

## API

```
GET    /api/health
GET    /api/games            ?status=wishlist|playing|played
POST   /api/games
GET    /api/games/{id}
PUT    /api/games/{id}
DELETE /api/games/{id}
GET    /api/catalog/search   ?q=term          (merged Steam + IGDB search)
GET    /api/catalog/app/{source}/{id}          (source: steam | igdb)
```

## Commands

- `make db-up` / `db-down` — Postgres via Docker
- `make backend` — Go API
- `make frontend` — Next.js dev server
- `make seed` — sample games
- `make test` — `go test ./...` + frontend type check
- `make build` — production build of both
