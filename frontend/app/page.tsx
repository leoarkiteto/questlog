"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { STATUSES } from "@/lib/types";
import type { Game } from "@/lib/types";
import GameRow from "@/components/GameRow";
import GameCover from "@/components/GameCover";
import StarRating from "@/components/StarRating";

export default function Dashboard() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .list()
      .then(setGames)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const byStatus = (s: (typeof STATUSES)[number]["value"]) =>
    games.filter((g) => g.status === s);

  const featured =
    games
      .filter((g) => g.status === "played" && g.rating > 0)
      .sort((a, b) => b.rating - a.rating || b.updatedAt.localeCompare(a.updatedAt))[0] ??
    games[0];

  if (loading) {
    return (
      <div className="space-y-8 px-4 sm:px-6">
        <div className="h-56 animate-pulse rounded-2xl bg-zinc-900 sm:h-72" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3 overflow-hidden">
            {[0, 1, 2, 3].map((j) => (
              <div
                key={j}
                className="h-48 w-32 shrink-0 animate-pulse rounded-lg bg-zinc-900 sm:h-56 sm:w-40"
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm font-semibold text-red-400">Couldn&apos;t reach the API</p>
        <p className="mt-1 text-xs text-zinc-500">{error}</p>
        <p className="mt-2 text-xs text-zinc-600">
          Make sure the backend is running on port 8080 (
          <code className="text-zinc-400">make backend</code>).
        </p>
        <button
          onClick={load}
          className="mt-4 rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-red-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Featured hero — the top-rated played game, mirroring the reference's big card */}
      {featured ? (
        <Link
          href={`/games/${featured.id}`}
          className="group relative mx-4 block overflow-hidden rounded-2xl ring-1 ring-white/10 sm:mx-6"
        >
          <GameCover
            title={featured.title}
            src={featured.coverUrl}
            className="h-60 w-full sm:h-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-400">
              Featured · {featured.status === "played" ? "Top rated" : "Latest"}
            </p>
            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow sm:text-5xl">
              {featured.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-300">
              {featured.rating > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur">
                  <StarRating value={featured.rating} size="sm" />
                </span>
              )}
              <span>{[featured.platform, featured.year?.toString()].filter(Boolean).join(" · ")}</span>
            </div>
            <span className="mt-3 inline-block rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-red-900/40 transition group-hover:bg-red-500">
              View →
            </span>
          </div>
        </Link>
      ) : (
        <div className="mx-4 rounded-2xl bg-gradient-to-r from-red-950/60 to-zinc-900 px-5 py-8 ring-1 ring-white/10 sm:mx-6 sm:px-8">
          <h1 className="text-2xl font-black text-white sm:text-3xl">
            Welcome to your GameLog
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Track games you want to play, are playing, and have played.
          </p>
        </div>
      )}

      {/* Horizontal rows per status */}
      <div className="mt-8">
        {STATUSES.map((s) => (
          <GameRow
            key={s.value}
            status={s.value}
            games={byStatus(s.value)}
            showAllHref="/library"
          />
        ))}
      </div>
    </div>
  );
}
