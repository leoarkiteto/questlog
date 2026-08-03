import Link from "next/link";

interface Props {
  title: string;
  message?: string;
  actionHref?: string;
  actionLabel?: string;
}

export default function EmptyState({ title, message, actionHref, actionLabel }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-zinc-300">{title}</p>
      {message && <p className="max-w-xs text-xs text-zinc-500">{message}</p>}
      {actionHref && (
        <Link
          href={actionHref}
          className="mt-2 rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-red-500"
        >
          {actionLabel ?? "Add a game"}
        </Link>
      )}
    </div>
  );
}
