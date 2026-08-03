// Vercel serverless function: serves the Questlog REST API as /api/*.
//
// Vercel builds this directory as a Go function (see vercel.json
// rewrites mapping /api/* here). The connection pool and catalog
// clients are created once per cold start; migrations are NOT run
// here — run them with `go run ./backend/cmd/migrate` (CI does this
// before deploying).
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"questlog/internal/api"
	"questlog/internal/catalog"
	"questlog/internal/igdb"
	"questlog/internal/repo"
	"questlog/internal/steam"
)

var (
	once  sync.Once
	store *repo.Store
	svc   *catalog.Service
	initErr error
)

func initHandler() {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://gamelog@localhost:5432/gamelog"
	}

	store, initErr = repo.New(ctx, dbURL)
	if initErr != nil {
		log.Printf("questlog: db init: %v", initErr)
		return
	}
	svc = catalog.New(
		steam.New(os.Getenv("STEAM_API_KEY")),
		igdb.New(
			os.Getenv("IGDB_CLIENT_ID"),
			os.Getenv("IGDB_CLIENT_SECRET"),
			"", "", // defaults to api.igdb.com
		),
	)
}

// Handler is the Vercel Go entry point.
func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(initHandler)
	if initErr != nil {
		http.Error(w, "database unavailable: "+initErr.Error(), http.StatusServiceUnavailable)
		return
	}
	api.New(store, svc).ServeHTTP(w, r)
}
