"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { GameInput } from "@/lib/types";
import GameForm from "@/components/GameForm";

export default function NewGamePage() {
  const router = useRouter();

  const submit = async (input: GameInput) => {
    const created = await api.create(input);
    router.push(`/games/${created.id}`);
  };

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6">
      <h1 className="mb-6 text-xl font-bold text-zinc-100">Add a game</h1>
      <GameForm submitLabel="Add game" onSubmit={submit} />
    </div>
  );
}
