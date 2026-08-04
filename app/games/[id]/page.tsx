"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { STATUSES, statusInfo } from "@/lib/types";
import type { Game, GameInput, Status } from "@/lib/types";
import GameCover from "@/components/GameCover";
import GameCard from "@/components/GameCard";
import StarRating from "@/components/StarRating";
import StatusBadge from "@/components/StatusBadge";

export default function GameDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [related, setRelated] = useState<Game[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [steamBusy, setSteamBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [g, all] = await Promise.all([api.get(params.id), api.list()]);
      setGame(g);
      setRelated(
        all
          .filter((x) => x.id !== g.id && x.status === g.status)
          .sort((a, b) => b.rating - a.rating || b.updatedAt.localeCompare(a.updatedAt))
          .slice(0, 12)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load game.");
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Persist a single field (rating / status) and update locally.
  const patch = async (next: Partial<GameInput>) => {
    if (!game) return;
    setSaving(true);
    try {
      const updated = await api.update(game.id, {
        title: game.title,
        status: next.status ?? game.status,
        rating: next.rating ?? game.rating,
        platform: game.platform,
        year: game.year,
        genre: game.genre,
        coverUrl: game.coverUrl,
        description: game.description,
        notes: game.notes,
        steamAppId: game.steamAppId,
      });
      setGame(updated);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!game) return;
    if (!window.confirm(`Delete "${game.title}" from your Questlog?`)) return;
    await api.remove(game.id);
    router.push("/");
  };

  // Enrich an existing entry (e.g. one created before the catalog
  // integration) with cover + metadata from Steam or RAWG, keeping
  // rating/status/notes.
  const enrichFromCatalog = async () => {
    if (!game || steamBusy) return;
    setSteamBusy(true);
    try {
      const matches = await api.catalog.search(game.title);
      const lower = game.title.toLowerCase();
      const exact = matches.find((m) => m.name.toLowerCase() === lower);
      let match = exact;
      if (!match) {
        // No exact match: Steam's search often surfaces random same-titled
        // games; IGDB's fuzzy search is more likely the right title.
        match = matches.find((m) => m.source === "igdb") ?? matches[0];
      }
      if (!match) {
        alert(`No cover found for "${game.title}".`);
        return;
      }
      if (!exact) {
        alert(`No exact match for "${game.title}" — using "${match.name}".`);
      }
      const d = await api.catalog.app(match.source, match.appid);
      const updated = await api.update(game.id, {
        title: game.title,
        status: game.status,
        rating: game.rating,
        platform: game.platform || match.platform || d.platform, // keep user's platform if set
        year: game.year ?? d.year,
        genre: game.genre || d.genre,
        coverUrl: d.coverUrl || game.coverUrl, // the point — apply the cover
        description: game.description || d.description,
        notes: game.notes,
        steamAppId: d.source === "steam" ? d.appid : null,
      });
      setGame(updated);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lookup failed.");
    } finally {
      setSteamBusy(false);
    }
  };

  if (error) {
    return (
      <div className="px-4 py-16 text-center sm:px-6">
        <p className="text-sm font-semibold text-red-400">{error}</p>
        <Link href="/" className="mt-3 inline-block text-sm text-zinc-400 hover:text-zinc-100">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  if (!game) {
    return <p className="px-4 text-sm text-zinc-500 sm:px-6">Loading…</p>;
  }

  const info = statusInfo(game.status);
  const chips = [game.platform, game.year?.toString(), game.genre].filter(Boolean);

  return (
    <div>
      {/* Hero */}
      <div className="relative">
        <GameCover title={game.title} src={game.coverUrl} className="h-72 w-full sm:h-96" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/55 to-zinc-950/20" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={game.status} />
            {chips.map((c) => (
              <span
                key={c}
                className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-zinc-200 backdrop-blur"
              >
                {c}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white drop-shadow sm:text-5xl">
            {game.title}
          </h1>

          {/* Rating — the centerpiece for played games */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-xl bg-black/50 px-3 py-2 backdrop-blur">
              <StarRating
                value={game.rating}
                onChange={(r) => patch({ rating: r })}
                size="lg"
                label={`Rate ${game.title}`}
              />
              <span className="text-xs text-zinc-400">
                {game.rating > 0 ? `${game.rating} / 5` : "Tap to rate"}
              </span>
            </div>
            {saving && <span className="text-xs text-zinc-500">saving…</span>}
          </div>

          {/* Quick status change */}
          <div className="mt-4 flex flex-wrap gap-2">
            {STATUSES.map((s) => {
              const active = s.value === game.status;
              return (
                <button
                  key={s.value}
                  onClick={() => !active && patch({ status: s.value })}
                  disabled={active}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition active:scale-95 ${
                    active
                      ? "bg-white/15 text-white ring-white/30"
                      : "bg-zinc-900/70 text-zinc-400 ring-white/10 hover:text-zinc-100"
                  }`}
                >
                  Move to {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        {/* Description (usually from Steam) */}
        {game.description && (
          <section className="mb-10">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              About
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-zinc-300">
              {game.description}
            </p>
          </section>
        )}

        {/* Notes */}
        <section className="mb-10">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Notes
          </h2>
          {game.notes ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
              {game.notes}
            </p>
          ) : (
            <p className="text-sm text-zinc-600">No notes yet.</p>
          )}
        </section>

        {/* More Like This — same status, mirroring the reference's row */}
        {related.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-lg font-bold text-zinc-100">
              More Like This{" "}
              <span className={`text-sm font-medium ${info.accent}`}>
                ({info.label})
              </span>
            </h2>
            <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-2">
              {related.map((g) => (
                <GameCard
                  key={g.id}
                  game={g}
                  className="w-32 shrink-0 snap-start sm:w-40"
                />
              ))}
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 border-t border-white/5 pt-6">
          <button
            onClick={enrichFromCatalog}
            disabled={steamBusy}
            className="rounded-full bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-500/30 transition hover:bg-emerald-900 disabled:opacity-50"
          >
            {steamBusy ? "Fetching…" : "Get cover online"}
          </button>
          <Link
            href={`/games/${game.id}/edit`}
            className="rounded-full bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-100 ring-1 ring-white/10 transition hover:bg-zinc-700"
          >
            Edit
          </Link>
          <button
            onClick={remove}
            className="rounded-full bg-red-950 px-5 py-2.5 text-sm font-semibold text-red-300 ring-1 ring-red-500/30 transition hover:bg-red-900"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
