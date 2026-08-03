"use client";

import { useState } from "react";

interface Props {
  value: number; // 0..5
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const SIZES = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-8 w-8" };

/**
 * 5-star rating. Read-only when onChange is not provided;
 * interactive (tap a star, hover preview) otherwise.
 */
export default function StarRating({ value, onChange, size = "md", label }: Props) {
  const [hover, setHover] = useState(0);
  const shown = hover > 0 ? hover : value;
  const interactive = !!onChange;

  return (
    <div
      className="inline-flex items-center gap-1"
      role={interactive ? "radiogroup" : "img"}
      aria-label={label ?? "Rating"}
      aria-roledescription="stars"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(value === n ? 0 : n)}
          onMouseEnter={() => interactive && setHover(n)}
          onFocus={() => interactive && setHover(n)}
          onBlur={() => setHover(0)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          aria-checked={interactive ? shown === n : undefined}
          className={interactive ? "cursor-pointer transition-transform active:scale-90" : "cursor-default"}
        >
          <svg
            viewBox="0 0 24 24"
            className={`${SIZES[size]} ${
              n <= shown
                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.45)]"
                : "fill-zinc-700 text-zinc-700"
            }`}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}
