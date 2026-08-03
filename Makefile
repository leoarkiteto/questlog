.PHONY: db-up db-down db-logs backend frontend seed test build clean

## Database -------------------------------------------------------------
db-up:            ## Start Postgres (docker compose)
	docker compose up -d db

db-down:
	docker compose down

db-logs:
	docker compose logs -f db

## Apps -----------------------------------------------------------------
backend:          ## Run the Go API on :8080 (needs Postgres on :5432)
	cd backend && go run .

frontend:         ## Run the Next.js dev server on :3000
	npm run dev

migrate:          ## Apply DB migrations (reads DATABASE_URL from env/.env)
	cd backend && go run ./cmd/migrate

## Helpers --------------------------------------------------------------
seed:             ## Insert a few sample games
	@bash scripts/seed.sh

test:             ## Run backend unit tests + frontend type check
	cd backend && go test ./...
	npx tsc --noEmit

build:
	cd backend && go build ./...
	npm run build

clean:
	rm -rf backend/bin .next
