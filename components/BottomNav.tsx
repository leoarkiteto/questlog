"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: "M3 10.5L12 3l9 7.5M5 9v11h14V9" },
  { href: "/search", label: "Search", icon: "M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" },
  { href: "/library", label: "Library", icon: "M4 5h16M4 12h16M4 19h10" },
];

/**
 * Mobile-only bottom navigation, mirroring the reference app layout:
 * Home · Search · + (add) · Library.
 */
export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-zinc-950/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <div className="grid grid-cols-4 items-center">
        {items.slice(0, 2).map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-zinc-500 transition active:scale-95"
            aria-current={isActive(it.href) ? "page" : undefined}
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-6 w-6 fill-none stroke-current ${
                isActive(it.href) ? "stroke-red-500 text-red-500" : "stroke-zinc-400"
              }`}
            >
              <path d={it.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {it.label}
          </Link>
        ))}

        <Link
          href="/games/new"
          aria-label="Add game"
          className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-zinc-500"
        >
          <span className="-mt-5 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-b from-red-500 to-red-700 text-2xl font-bold text-white shadow-lg shadow-red-900/50 ring-4 ring-zinc-950 transition active:scale-95">
            +
          </span>
          Add
        </Link>

        {items.slice(2).map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-zinc-500 transition active:scale-95"
            aria-current={isActive(it.href) ? "page" : undefined}
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-6 w-6 fill-none stroke-current ${
                isActive(it.href) ? "stroke-red-500 text-red-500" : "stroke-zinc-400"
              }`}
            >
              <path d={it.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {it.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
