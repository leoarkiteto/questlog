import { Flag, Gamepad2, ShoppingBag, Sparkles, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Status } from "@/lib/types";

const ICONS: Record<Status, LucideIcon> = {
  wishlist: Sparkles, // a wish
  purchased: ShoppingBag, // bought
  playing: Gamepad2, // on now
  played: Trophy, // finished
  dropped: Flag, // gave up
};

/**
 * The icon for a game status, used next to status titles, badges
 * and pickers. Renders with currentColor so callers control the color.
 */
export default function StatusIcon({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  const Icon = ICONS[status] ?? Sparkles;
  return <Icon className={className} aria-hidden="true" />;
}
