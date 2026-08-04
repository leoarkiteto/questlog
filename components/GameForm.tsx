"use client";

import { FormEvent, useRef, useState } from "react";
import { api } from "@/lib/api";
import { COMMON_PLATFORMS, STATUSES } from "@/lib/types";
import type { CatalogResult, Game, GameInput, Status } from "@/lib/types";
import StarRating from "./StarRating";
import GameCover from "./GameCover";

const SOURCE_LABEL: Record<string, string> = {
  steam: "Steam",
  igdb: "IGDB",
};

interface Props {
  initial?: Game;
  submitLabel: string;
  onSubmit: (input: GameInput) => Promise<void>;
}

export default function GameForm({ initial, submitLabel, onSubmit }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [status, setStatus] = useState<Status>(initial?.status ?? "wishlist");
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [platform, setPlatform] = useState(initial?.platform ?? "");
  const [year, setYear] = useState(initial?.year?.toString() ?? "");
  const [genre, setGenre] = useState(initial?.genre ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [steamAppId, setSteamAppId] = useState<number | null>(
    initial?.steamAppId ?? null
  );

  // Steam suggestion state (searches run off the title field)
  const [steamResults, setSteamResults] = useState<CatalogResult[]>([]);
  const [steamSearching, setSteamSearching] = useState(false);
  const [steamFetching, setSteamFetching] = useState(false);
  const [steamError, setSteamError] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const runSteamSearch = async (q: string) => {
    const term = q.trim();
    if (term.length < 2) return;
    setSteamSearching(true);
    setSteamError(null);
    try {
      const results = await api.catalog.search(term);
      setSteamResults(results);
      if (results.length === 0) setSteamError(`No matches for "${term}".`);
    } catch (e) {
      setSteamResults([]);
      setSteamError(e instanceof Error ? e.message : "Search failed.");
    } finally {
      setSteamSearching(false);
    }
  };

  const handleTitleChange = (v: string) => {
    setTitle(v);
    setSteamResults([]); // previous suggestions no longer match
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => runSteamSearch(v), 500);
  };

  const pickCatalogResult = async (r: CatalogResult) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSteamFetching(true);
    setSteamError(null);
    try {
      const d = await api.catalog.app(r.source, r.appid);
      setTitle(d.name);
      setCoverUrl(d.coverUrl); // the point — always apply the cover
      setYear(year || (d.year?.toString() ?? "")); // keep user's data if set
      setGenre(genre || d.genre);
      setPlatform(platform || r.platform || d.platform);
      setDescription(description || d.description);
      setSteamAppId(d.source === "steam" ? d.appid : null); // RAWG = non-Steam
      setSteamResults([]);
    } catch (e) {
      setSteamError(e instanceof Error ? e.message : "Couldn't load that game.");
    } finally {
      setSteamFetching(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    const parsedYear = year.trim() === "" ? null : Number(year);
    if (parsedYear !== null && (Number.isNaN(parsedYear) || parsedYear < 1950 || parsedYear > 2100)) {
      setError("Year must be between 1950 and 2100.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        status,
        rating,
        platform: platform.trim(),
        year: parsedYear,
        genre: genre.trim(),
        coverUrl: coverUrl.trim(),
        description: description.trim(),
        notes: notes.trim(),
        steamAppId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  };

  const field =
    "w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-red-500/50";
  const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400";

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Status picker */}
      <div>
        <span className={label}>List</span>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              aria-pressed={status === s.value}
              className={`rounded-xl px-2 py-2.5 text-xs font-semibold ring-1 transition active:scale-[0.98] ${
                status === s.value
                  ? "bg-red-600 text-white ring-red-500"
                  : "bg-zinc-900 text-zinc-400 ring-white/10 hover:text-zinc-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title + Steam suggestions */}
      <div>
        <label htmlFor="title" className={label}>
          Title *
        </label>
        <div className="flex gap-2">
          <input
            id="title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Elden Ring"
            className={field}
            autoFocus
          />
          <button
            type="button"
            onClick={() => runSteamSearch(title)}
            disabled={steamSearching || steamFetching || title.trim().length < 2}
            className="shrink-0 rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-100 ring-1 ring-white/10 transition hover:bg-zinc-700 disabled:opacity-50"
          >
            {steamSearching ? "Searching…" : "Search Steam"}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-zinc-600">
          Start typing — tap a Steam match to auto-fill cover, year, genre, platform &amp; description.
        </p>

        {steamFetching && (
          <p className="mt-2 text-xs text-zinc-500">Fetching game details…</p>
        )}

        {steamResults.length > 0 && (
          <ul className="mt-2 max-h-56 divide-y divide-white/5 overflow-y-auto rounded-lg bg-zinc-950/60 ring-1 ring-white/5">
            {steamResults.map((r) => (
              <li key={`${r.source}-${r.appid}`}>
                <button
                  type="button"
                  onClick={() => pickCatalogResult(r)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-zinc-200 transition hover:bg-zinc-800/70"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">{r.name}</span>
                    {r.platform && (
                      <span className="hidden shrink-0 text-[11px] text-zinc-500 sm:inline">
                        {r.platform}
                      </span>
                    )}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      r.source === "steam"
                        ? "bg-sky-500/15 text-sky-300"
                        : "bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    {SOURCE_LABEL[r.source] ?? r.source}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {steamError && (
          <p className="mt-2 text-xs text-amber-400/90">{steamError}</p>
        )}
        {steamAppId && (
          <p className="mt-2 text-[11px] text-zinc-600">
            ✓ Linked to Steam app {steamAppId}
          </p>
        )}
      </div>

      {/* Rating — centerpiece for played games */}
      <div>
        <span className={label}>
          Rating{" "}
          {status === "played" || status === "dropped"
            ? "· how much did you like it?"
            : "· rate once played"}
        </span>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3">
          <StarRating value={rating} onChange={setRating} size="lg" />
          <span className="text-xs text-zinc-500">
            {rating === 0 ? "Tap a star" : `${rating} / 5`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="platform" className={label}>
            Platform
          </label>
          <input
            id="platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="e.g. Nintendo Switch"
            list="platforms"
            className={field}
          />
          <datalist id="platforms">
            {COMMON_PLATFORMS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="year" className={label}>
            Year
          </label>
          <input
            id="year"
            type="number"
            min={1950}
            max={2100}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2022"
            className={field}
          />
        </div>
      </div>

      <div>
        <label htmlFor="genre" className={label}>
          Genre
        </label>
        <input
          id="genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          placeholder="e.g. Action RPG"
          className={field}
        />
      </div>

      {/* Cover URL with live preview */}
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <label htmlFor="coverUrl" className={label}>
            Cover image URL
          </label>
          <input
            id="coverUrl"
            type="url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://…/cover.jpg"
            className={field}
          />
          <p className="mt-1 text-[11px] text-zinc-600">
            Auto-filled from Steam, or paste your own link.
          </p>
        </div>
        <div className="w-20 shrink-0">
          <GameCover
            title={title || "Cover"}
            src={coverUrl}
            className="aspect-[2/3] rounded-lg ring-1 ring-white/10"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className={label}>
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Short description of the game…"
          className={`${field} resize-y`}
        />
      </div>

      <div>
        <label htmlFor="notes" className={label}>
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="What did you think? Where to buy it?…"
          className={`${field} resize-y`}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/30">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-gradient-to-b from-red-500 to-red-700 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/40 transition hover:from-red-400 hover:to-red-600 active:scale-[0.99] disabled:opacity-50"
      >
        {saving ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
