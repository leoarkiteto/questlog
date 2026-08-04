"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { STATUSES } from "@/lib/types";
import type { Game, Status } from "@/lib/types";
import GameCard from "@/components/GameCard";
import EmptyState from "@/components/EmptyState";
import StatusIcon from "@/components/StatusIcon";

const FILTERS: { value: Status | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...STATUSES.map((s) => ({ value: s.value as Status, label: s.label })),
];

function isFilter(value: string | null): value is Status | "all" {
  return value !== null && FILTERS.some((f) => f.value === value);
}

function LibraryContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "all">("all");

  // Keep in sync when navigating here from a row's "Show all" link.
  useEffect(() => {
    const f = params.get("filter");
    setFilter(isFilter(f) ? f : "all");
  }, [params]);

  useEffect(() => {
    api
      .list()
      .then(setGames)
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, []);

  const selectFilter = (value: Status | "all") => {
    setFilter(value);
    router.replace(value === "all" ? "/library" : `/library?filter=${value}`);
  };

  const shown = filter === "all" ? games : games.filter((g) => g.status === filter);

  return (
    <div className="px-4 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">Library</h1>
        <span className="text-xs text-zinc-500">{games.length} games</span>
      </div>

      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => selectFilter(f.value)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === f.value
                ? "bg-red-600 text-white"
                : "bg-zinc-900 text-zinc-400 ring-1 ring-white/10 hover:text-zinc-200"
            }`}
          >
            {f.value !== "all" && <StatusIcon status={f.value as Status} className="h-3.5 w-3.5" />}
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : shown.length === 0 ? (
        <EmptyState
          title={filter === "all" ? "Your library is empty" : "Nothing in this list"}
          message="Games you add will show up here, organized by status."
          actionHref="/games/new"
        />
      ) : (
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {shown.map((g) => (
            <GameCard key={g.id} game={g} className="w-full" />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<p className="px-4 text-sm text-zinc-500 sm:px-6">Loading…</p>}>
      <LibraryContent />
    </Suspense>
  );
}
