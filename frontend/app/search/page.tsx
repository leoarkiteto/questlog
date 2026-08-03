"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Game } from "@/lib/types";
import GameCard from "@/components/GameCard";
import EmptyState from "@/components/EmptyState";

// Results view for the header search bar. There is intentionally no
// search input here — the search bar lives once, in the header.
function SearchContent() {
  const params = useSearchParams();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(params.get("q") ?? "");

  // Keep in sync when the header bar navigates here with a new query.
  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  useEffect(() => {
    api
      .list()
      .then(setGames)
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, []);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return games;
    return games.filter((g) =>
      [g.title, g.platform, g.genre, g.status]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(needle))
    );
  }, [games, q]);

  const term = q.trim();

  return (
    <div className="px-4 sm:px-6">
      <h1 className="mb-4 text-xl font-bold text-zinc-100">
        {term ? (
          <>
            Results for <span className="text-red-400">“{term}”</span>
          </>
        ) : (
          "Search"
        )}
      </h1>

      {!term && (
        <p className="mb-6 text-sm text-zinc-500">
          Type in the search bar at the top of the app to search your collection.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : term && results.length === 0 ? (
        <EmptyState
          title={`No games match "${term}"`}
          message="Search your collection by title, platform, or genre."
        />
      ) : results.length === 0 ? (
        <EmptyState
          title="No games yet"
          message="Add your first game to see it here."
          actionHref="/games/new"
        />
      ) : (
        <>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
            {term ? `${results.length} result${results.length > 1 ? "s" : ""}` : "All games"}
          </p>
          <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {results.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
          {!term && (
            <Link
              href="/library"
              className="mt-6 inline-block text-sm font-medium text-zinc-400 transition hover:text-zinc-100"
            >
              Browse the full library →
            </Link>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="px-4 text-sm text-zinc-500 sm:px-6">Loading…</p>}>
      <SearchContent />
    </Suspense>
  );
}
