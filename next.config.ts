import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// CSP: tylko własne zasoby. 'unsafe-inline' dla skryptów wymagają skrypty startowe Next.js
// (bez nonce); 'unsafe-eval' tylko w trybie deweloperskim (HMR).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",  // zdjęcia produktów mogą być linkami zewnętrznymi
  "font-src 'self' data:",
  `connect-src 'self'${isProd ? "" : " ws: wss:"}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },                 // clickjacking
  { key: "X-Content-Type-Options", value: "nosniff" },       // brak zgadywania typu pliku
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // osobisty link handlowca (/r/<token>) nie może wyciec w nagłówku Referer
      { source: "/r/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
    ];
  },
};

export default nextConfig;
