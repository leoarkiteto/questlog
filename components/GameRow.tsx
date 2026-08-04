import Link from "next/link";
import GameCard from "./GameCard";
import StatusIcon from "./StatusIcon";
import { statusInfo } from "@/lib/types";
import type { Game, Status } from "@/lib/types";

interface Props {
  status: Status;
  games: Game[];
  /** link target for the row header's "Show all" */
  showAllHref?: string;
}

/**
 * Netflix-style horizontal scrolling row: header + snap-scroll cards.
 */
export default function GameRow({ status, games, showAllHref }: Props) {
  const info = statusInfo(status);

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between px-4 sm:px-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-100">
          <StatusIcon status={status} className={`h-4 w-4 ${info.accent}`} />
          {info.label}
          <span className="text-xs font-medium text-zinc-500">{games.length}</span>
        </h2>
        {showAllHref && games.length > 0 && (
          <Link
            href={showAllHref}
            className="text-xs font-medium text-zinc-400 transition hover:text-zinc-100"
          >
            Show all →
          </Link>
        )}
      </div>

      {games.length === 0 ? (
        <p className="px-4 text-sm text-zinc-600 sm:px-6">
          Nothing here yet — add a game with the + button.
        </p>
      ) : (
        <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-4 pb-2 scroll-px-4 sm:px-6 sm:scroll-px-6">
          {games.map((g) => (
            <GameCard
              key={g.id}
              game={g}
              className="w-32 shrink-0 snap-start sm:w-40"
            />
          ))}
          <div className="w-2 shrink-0" aria-hidden />
        </div>
      )}
    </section>
  );
}
