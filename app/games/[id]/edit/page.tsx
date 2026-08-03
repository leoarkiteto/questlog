"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Game, GameInput } from "@/lib/types";
import GameForm from "@/components/GameForm";

export default function EditGamePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get(params.id)
      .then(setGame)
      .catch((e) => setError(e.message));
  }, [params.id]);

  const submit = async (input: GameInput) => {
    await api.update(params.id, input);
    router.push(`/games/${params.id}`);
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

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6">
      <h1 className="mb-6 text-xl font-bold text-zinc-100">Edit game</h1>
      <GameForm key={game.id} initial={game} submitLabel="Save changes" onSubmit={submit} />
    </div>
  );
}
