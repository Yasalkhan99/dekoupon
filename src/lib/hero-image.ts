/**
 * Client-safe hero slide image URLs (no server Supabase import).
 * Hero slider: prefers the first usable <img> inside post body (content), not the featured `image` field.
 * Featured image is only used when the article has no valid in-body image.
 */

const DEFAULT_FALLBACK = "https://picsum.photos/id/1/1200/600";

/** Editor/exports often produce filenames literally named "undefined" — those 404 on the server. */
export function isBrokenPlaceholderSrc(url: string): boolean {
  const u = url.trim();
  if (!u) return false;
  try {
    const pathOnly = u.includes("://") ? new URL(u).pathname : u;
    const decoded = decodeURIComponent(pathOnly);
    if (/\/undefined\b/i.test(decoded)) return true;
    const file = decoded.split("/").pop() || "";
    return /^undefined/i.test(file);
  } catch {
    return /\/undefined/i.test(decodeURIComponent(u));
  }
}

export function getFirstImgSrcFromHtml(html: string | undefined): string | undefined {
  if (!html) return undefined;
  const re = /<img[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const src = m[1]?.trim();
    if (src && !isBrokenPlaceholderSrc(src)) return src;
  }
  return undefined;
}

function heroFallbackImageUrl(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const id = 2 + (Math.abs(h) % 84);
  return `https://picsum.photos/id/${id}/1200/600`;
}

function supabasePublicUploadUrl(localPath: string): string | null {
  const filename = localPath.replace(/^.*\/uploads\//i, "").replace(/\?.*$/, "").trim();
  if (!filename) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/uploads/${filename}`;
}

function absolutizeImageCandidate(candidate: string): string {
  const isLocalhost =
    /^https?:\/\/localhost(\d*)(\/|$)/i.test(candidate) ||
    /^https?:\/\/127\.0\.0\.1(\d*)(\/|$)/i.test(candidate);
  if (isLocalhost && /\/uploads\//i.test(candidate)) {
    const pub = supabasePublicUploadUrl(candidate);
    if (pub) return pub;
  }

  if (candidate.startsWith("/uploads/")) {
    const pub = supabasePublicUploadUrl(candidate);
    if (pub) return pub;
    const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    if (site) return `${site}${candidate}`;
  }

  if (candidate.startsWith("/")) {
    const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    return site ? `${site}${candidate}` : candidate;
  }

  return candidate;
}

/**
 * Hero slide background: first valid <img> from article HTML, then optional featured image, then fallback.
 * Does not modify blog data — only reads `content` before `image`.
 */
export function resolveHeroSlideImageUrl(
  featuredImage: string | undefined,
  contentHtml: string | undefined,
  fallbackSeed?: string
): string {
  let candidate = getFirstImgSrcFromHtml(contentHtml)?.trim() || "";

  if (!candidate) {
    const feat = (featuredImage || "").trim();
    if (feat && !isBrokenPlaceholderSrc(feat)) candidate = feat;
  }

  if (!candidate || isBrokenPlaceholderSrc(candidate)) {
    return fallbackSeed?.trim() ? heroFallbackImageUrl(fallbackSeed.trim()) : DEFAULT_FALLBACK;
  }

  return absolutizeImageCandidate(candidate);
}
