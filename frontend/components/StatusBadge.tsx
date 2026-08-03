import { statusInfo } from "@/lib/types";
import type { Status } from "@/lib/types";

const BADGE: Record<Status, string> = {
  wishlist: "bg-amber-400/10 text-amber-300 ring-amber-400/30",
  playing: "bg-sky-400/10 text-sky-300 ring-sky-400/30",
  played: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30",
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${BADGE[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusInfo(status).label}
    </span>
  );
}
