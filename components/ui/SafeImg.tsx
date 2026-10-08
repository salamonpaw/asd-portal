"use client";

import { useState } from "react";

/**
 * <img> z zastępnikiem, gdy obraz nie istnieje (np. martwy link). Wykrywa też błąd,
 * który nastąpił PRZED podpięciem Reacta (obraz z HTML serwera), przez sprawdzenie `complete`.
 */
export function SafeImg({ fallback = null, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fallback?: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (failed || !props.src) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img
      {...props}
      ref={(el) => { if (el && el.complete && el.naturalWidth === 0) setFailed(true); }}
      onError={() => setFailed(true)}
    />
  );
}
