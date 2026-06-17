/**
 * SiteFavicon — displays a website's favicon.
 *
 * Strategy (in priority order):
 *  1. localhost / LAN → letter avatar immediately (no network fetch attempted)
 *  2. Public URL      → tries DuckDuckGo favicon API (works without login, fast)
 *  3. On error        → falls back to letter avatar
 *
 * Usage:
 *   <SiteFavicon url="http://localhost:4962" size={20} />
 *   <SiteFavicon url="https://github.com/user/repo" size={28} />
 */
"use client";

import { useState } from "react";

interface Props {
  url: string;
  size?: number;
  className?: string;
}

const PALETTE = [
  "#3b82f6", "#22c55e", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
  "#84cc16", "#6366f1", "#14b8a6", "#a78bfa",
];

function domainColor(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) hash = (hash * 31 + url.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function urlInitial(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host.charAt(0).toUpperCase();
  } catch {
    return "?";
  }
}

function isLocal(url: string): boolean {
  try {
    const h = new URL(url).hostname;
    return (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h.endsWith(".local") ||
      /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(h)
    );
  } catch {
    return true;
  }
}

/** Return the best favicon URL to try. */
function faviconSrc(url: string): string | null {
  try {
    // Google's faviconV2 API returns up to 64px icons (best quality)
    const encoded = encodeURIComponent(url.split("/").slice(0, 3).join("/"));
    return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encoded}&size=64`;
  } catch {
    return null;
  }
}

/** Letter avatar fallback */
function Avatar({ url, size }: { url: string; size: number }) {
  const color = domainColor(url);
  const initial = urlInitial(url);
  const fontSize = Math.max(8, Math.round(size * 0.52));

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: Math.max(3, Math.round(size * 0.2)),
        background: color,
        color: "#fff",
        fontSize,
        fontWeight: 700,
        flexShrink: 0,
        userSelect: "none",
        lineHeight: 1,
      }}
    >
      {initial}
    </span>
  );
}

export function SiteFavicon({ url, size = 20, className }: Props) {
  const [failed, setFailed] = useState(false);

  const local = isLocal(url);
  const src = faviconSrc(url);

  if (local || !src || failed) {
    return (
      <span className={className} style={{ flexShrink: 0 }}>
        <Avatar url={url} size={size} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{
        borderRadius: Math.max(3, Math.round(size * 0.2)),
        flexShrink: 0,
        objectFit: "contain",
      }}
      onError={() => setFailed(true)}
    />
  );
}
