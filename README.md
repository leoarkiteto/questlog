# Questlog

Personal game collection manager — track games you **want to play/buy**, games you're **currently playing**, and games you've **played** (with 5-star ratings and the platform you played on). No accounts, no auth: it's your app on your machine.

The UI follows a Netflix/YouTube-style mobile layout: dark theme, header + search, horizontal-scrolling rows per list, a featured hero card, and a bottom nav on phones.

## Stack

| Layer    | Tech                                        |
| -------- | ------------------------------------------- |
| Frontend | Next.js 15 (App Router, TypeScript, Tailwind v4) |
| Backend  | Go (net/http, pgx) — dev server + Vercel backend service |
| Database | PostgreSQL 17                               |

```
questlog/                    # workspace folder (internal only)
├── app/                     # Next.js app at repo root (Vercel builds from here)
│   ├── app/                 # dashboard, search, library, game form/detail
│   ├── components/          # cards, rows, star rating, nav
│   └── lib/                 # API client + types
├── backend/                 # Go API (module questlog)
│   ├── main.go               # server entrypoint (also the Vercel backend service)
│   ├── cmd/migrate/          # standalone migrations runner (used by CI)
│   └── internal/            # api, model, repo, catalog, steam, igdb, config
├── .github/workflows/       # CI/CD (tests + migrate + Vercel deploy)
├── scripts/seed.sh          # sample data
├── docker-compose.yml       # Postgres only
├── vercel.json              # services: frontend (Next) + backend (Go); /api/* → backend
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
# before `npm run dev`:
NEXT_PUBLIC_API_URL=http://<your-machine-ip>:8080 npm run dev
```

Open `http://<your-machine-ip>:3000` from the phone (both devices on the same network). The API already allows cross-origin requests for this setup.

## Deploy to Vercel

The repo uses Vercel's **Services** model: two services in one project, deployed together with shared routing and env vars.

- `frontend` — the Next.js app at the repo root (`framework: nextjs`)
- `backend` — the Go API at `backend/` (entrypoint `backend/main.go`), routed from `/api/*` via `vercel.json` rewrites

On Vercel the frontend calls the API same-origin, so no `NEXT_PUBLIC_API_URL` is needed.

**One-time setup**

1. Import the repo at https://vercel.com/new (framework: Next.js — detected automatically).
2. Create a Postgres database (Vercel Storage → Postgres, or any Postgres/Neon/Supabase URL) and add these **Vercel project env vars**:
   `DATABASE_URL`, `STEAM_API_KEY`, `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET`
3. Generate a token at https://vercel.com/account/tokens, then add these **GitHub repository secrets** (Settings → Secrets and variables → Actions):
   - `VERCEL_TOKEN` — the token from step 3
   - `VERCEL_ORG_ID` — your Vercel team/user id (from `npx vercel whoami` → or Project Settings)
   - `VERCEL_PROJECT_ID` — the Vercel project id (Project Settings → General)
   - `DATABASE_URL` — same URL as above (used by CI to run migrations before deploy)

**Deploys**

Push to `main` → GitHub Actions runs tests (Go + TypeScript + build); on main it also runs DB migrations (`go run ./backend/cmd/migrate`) and deploys to Vercel. Until the secrets above exist, the deploy job is skipped and only tests run.

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
