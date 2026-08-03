import type { CatalogAppDetails, CatalogResult, Game, GameInput, Status } from "./types";

/**
 * Base URL of the Go API. Override at build/dev time with
 * NEXT_PUBLIC_API_URL, e.g. http://192.168.1.10:8080 when the
 * phone and the machine running the backend share a LAN.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body; keep generic message
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  list: (status?: Status) =>
    request<Game[]>(`/api/games${status ? `?status=${status}` : ""}`),
  get: (id: string | number) => request<Game>(`/api/games/${id}`),
  create: (input: GameInput) =>
    request<Game>("/api/games", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string | number, input: GameInput) =>
    request<Game>(`/api/games/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  remove: (id: string | number) =>
    request<void>(`/api/games/${id}`, { method: "DELETE" }),

  catalog: {
    search: (q: string) =>
      request<CatalogResult[]>(`/api/catalog/search?q=${encodeURIComponent(q)}`),
    app: (source: string, appid: number | string) =>
      request<CatalogAppDetails>(`/api/catalog/app/${source}/${appid}`),
  },
};
