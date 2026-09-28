"use client";

/** <img>, który chowa się, gdy obraz nie istnieje (np. martwy link zewnętrzny). */
export function SafeImg(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img {...props} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;
}
