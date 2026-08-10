"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders the logo on a white chip. Uses /logo.svg by default; drop a
 * /logo.png (or replace logo.svg) to use your own asset. Falls back to a text
 * wordmark if the image can't load, so the header never looks broken.
 */
export function Logo({
  subtitle,
  size = "md",
  src = "/logo.svg",
}: {
  subtitle?: string;
  size?: "md" | "lg";
  src?: string;
}) {
  const [ok, setOk] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const h = size === "lg" ? "h-11" : "h-9";
  const imgH = size === "lg" ? "h-9" : "h-7";

  // Catch the case where the image already failed before hydration attached onError.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setOk(false);
  }, []);

  return (
    <div className="flex items-center gap-3">
      {ok ? (
        <div className={`bg-white rounded-lg px-2 flex items-center ${h}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt="RDB IT Services"
            className={`${imgH} w-auto`}
            onError={() => setOk(false)}
          />
        </div>
      ) : (
        <div
          className={`${h} aspect-square rounded-lg bg-gradient-to-br from-brand to-brand2 grid place-items-center text-ink font-extrabold`}
        >
          R
        </div>
      )}
      <div className="leading-none">
        {!ok && <div className="font-bold text-white">RDB IT Services</div>}
        {subtitle && <div className="text-[11px] text-slate-400 mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}
