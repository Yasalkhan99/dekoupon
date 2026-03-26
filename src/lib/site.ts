/**
 * Canonical URLs and sitemap base. Uses NEXT_PUBLIC_SITE_URL when set (e.g. preview/staging).
 */

const DEFAULT_ORIGIN = "https://savingshub4u.com";

export function getSiteOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_ORIGIN).replace(/\/$/, "").trim();
  return raw || DEFAULT_ORIGIN;
}

/** Absolute canonical URL for a pathname (must start with /). */
export function canonicalUrl(pathname: string): string {
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const origin = getSiteOrigin();
  if (p === "/") return `${origin}/`;
  return `${origin}${p}`;
}
