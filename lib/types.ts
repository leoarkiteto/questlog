export type Status = "wishlist" | "purchased" | "playing" | "played" | "dropped";

export interface Game {
  id: number;
  title: string;
  status: Status;
  /** 0 = unrated, 1..5 stars */
  rating: number;
  platform: string;
  year: number | null;
  genre: string;
  coverUrl: string;
  /** short description, usually fetched from Steam */
  description: string;
  notes: string;
  /** Steam app id, when the game was linked via Steam */
  steamAppId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface GameInput {
  title: string;
  status: Status;
  rating: number;
  platform: string;
  year: number | null;
  genre: string;
  coverUrl: string;
  description: string;
  notes: string;
  steamAppId: number | null;
}

export interface CatalogResult {
  /** "steam" | "rawg" */
  source: string;
  appid: number;
  name: string;
  /** platform hint for non-Steam sources */
  platform?: string;
}

export interface CatalogAppDetails {
  source: string;
  appid: number;
  name: string;
  coverUrl: string;
  year: number | null;
  genre: string;
  platform: string;
  description: string;
  developers?: string[];
  metacritic?: number | null;
}

export interface StatusInfo {
  value: Status;
  label: string;
  /** one-line description shown under the row header */
  hint: string;
  /** accent color for badges/headers */
  accent: string;
}

export const STATUSES: StatusInfo[] = [
  { value: "wishlist", label: "Wish to Play / Buy", hint: "Games I want", accent: "text-amber-400" },
  { value: "purchased", label: "Purchased", hint: "Bought, not played yet", accent: "text-violet-400" },
  { value: "playing", label: "Currently Playing", hint: "Games I'm on now", accent: "text-sky-400" },
  { value: "played", label: "Played", hint: "Games I finished", accent: "text-emerald-400" },
  { value: "dropped", label: "Dropped", hint: "Tried, didn't finish", accent: "text-rose-400" },
];

export const statusInfo = (s: Status): StatusInfo =>
  STATUSES.find((x) => x.value === s) ?? STATUSES[0];

/** Platform choices offered in the add/edit form dropdown. */
export const PLATFORMS = [
  "Nintendo Switch",
  "Nintendo Switch 2",
  "PlayStation 5",
  "PlayStation 4",
  "Xbox Series",
  "Xbox One",
  "PlayStation 3",
  "PC",
  "Mobile",
] as const;
