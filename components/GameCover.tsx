"use client";

import { useState } from "react";

interface Props {
  title: string;
  src?: string;
  className?: string;
}

/**
 * Cover art with a dark gradient fallback (initial letter) when no
 * image or when the image fails to load.
 */
export default function GameCover({ title, src, className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  const showImg = !!src && !failed;
  const initial = title.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-black ${className}`}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={title}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-black text-zinc-600/70 select-none">
            {initial}
          </span>
        </div>
      )}
    </div>
  );
}
