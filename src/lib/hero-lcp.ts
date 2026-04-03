import type { BlogData, BlogPostWithContent } from "@/lib/blog";
import { resolveHeroSlideImageUrl } from "@/lib/hero-image";
import { HERO_PRIORITY_SLUGS, MAX_HERO_SLIDES } from "@/lib/hero-config";
import type { BlogPost } from "@/data/blog";

function buildHeroSlides(data: BlogData): BlogPost[] {
  const { allPosts, heroPost, featuredPosts, latestPosts } = data;
  const bySlug = new Map(allPosts.map((p) => [p.slug, p]));
  const out: BlogPost[] = [];
  const seen = new Set<string>();

  for (const slug of HERO_PRIORITY_SLUGS) {
    const p = bySlug.get(slug);
    if (p && !seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
  }

  const sortedNewest = [...allPosts].sort((a, b) => {
    const ta = new Date(a.createdAt ?? 0).getTime();
    const tb = new Date(b.createdAt ?? 0).getTime();
    return tb - ta;
  });

  for (const p of sortedNewest) {
    if (out.length >= MAX_HERO_SLIDES) break;
    if (!seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
  }

  if (out.length > 0) return out;

  const fallback: BlogPost[] = [];
  if (heroPost?.id) {
    fallback.push(heroPost);
    seen.add(heroPost.id);
  }
  for (const p of [...featuredPosts, ...latestPosts]) {
    if (fallback.length >= 5) break;
    if (!seen.has(p.id)) {
      seen.add(p.id);
      fallback.push(p);
    }
  }
  return fallback;
}

/** First visible hero slide image URL (matches client `Hero` ordering) — for LCP preload + fetchPriority. */
export function getHomeHeroLcpImageUrl(data: BlogData): string | null {
  const slides = buildHeroSlides(data);
  const first = slides[0];
  if (!first) return null;
  const withContent = first as BlogPostWithContent;
  return resolveHeroSlideImageUrl(withContent.image, withContent.content, first.slug);
}
