"use client";

import Link from "next/link";
import GameCover from "./GameCover";
import StarRating from "./StarRating";
import { statusInfo } from "@/lib/types";
import type { Game } from "@/lib/types";

interface Props {
  game: Game;
}

/**
 * Card shown in the horizontal rows: cover, title, platform · year,
 * and star rating for played games.
 */
export default function GameCard({ game }: Props) {
  const meta = [game.platform, game.year?.toString()].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/games/${game.id}`}
      className="group flex w-32 shrink-0 snap-start flex-col gap-1.5 outline-none sm:w-40"
    >
      <div className="relative">
        <GameCover
          title={game.title}
          src={game.coverUrl}
          className="aspect-[2/3] w-full rounded-lg shadow-lg ring-1 ring-white/10 transition duration-200 group-hover:ring-red-500/60 group-hover:shadow-red-500/10"
        />
        {game.status === "played" && game.rating > 0 && (
          <span className="absolute right-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 backdrop-blur">
            <StarRating value={game.rating} size="sm" />
          </span>
        )}
      </div>
      <div className="px-0.5">
        <h3
          className="truncate text-sm font-semibold text-zinc-100"
          title={game.title}
        >
          {game.title}
        </h3>
        <p className={`truncate text-xs ${statusInfo(game.status).accent}`}>
          {meta || statusInfo(game.status).label}
        </p>
      </div>
    </Link>
  );
}
