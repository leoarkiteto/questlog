"use client";

import Link from "next/link";
import GameCover from "./GameCover";
import PlatformIcon from "./PlatformIcon";
import type { Game } from "@/lib/types";

interface Props {
  game: Game;
  /**
   * Layout width classes — fixed width in scroll rows
   * (e.g. "w-32 shrink-0 snap-start sm:w-40"), "w-full" in grids.
   */
  className?: string;
}

/**
 * Card shown in the horizontal rows: cover, compact star rating (always
 * visible — filled for rated games, outline for 0/5), and title with a
 * platform icon beside it.
 */
export default function GameCard({ game, className = "" }: Props) {
  const rated = game.rating > 0;

  return (
    <Link
      href={`/games/${game.id}`}
      className={`group flex flex-col gap-1.5 outline-none ${className}`}
    >
      <GameCover
        title={game.title}
        src={game.coverUrl}
        className="aspect-[2/3] w-full rounded-lg shadow-lg ring-1 ring-white/10 transition duration-200 group-hover:ring-red-500/60 group-hover:shadow-red-500/10"
      />
      <div className="px-0.5">
        <div className="mb-0.5 flex items-center gap-1">
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 ${
              rated
                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.45)]"
                : "fill-zinc-700 text-zinc-700"
            }`}
            aria-hidden="true"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className={`text-xs font-medium ${rated ? "text-amber-300/90" : "text-zinc-600"}`}>
            {game.rating}/5
          </span>
        </div>
        <div className="flex items-center gap-1">
          <h3
            className="min-w-0 truncate text-sm font-semibold text-zinc-100"
            title={game.title}
          >
            {game.title}
          </h3>
          {game.platform && (
            <PlatformIcon
              platform={game.platform}
              className="h-3.5 w-3.5 shrink-0 text-zinc-500"
            />
          )}
        </div>
      </div>
    </Link>
  );
}
