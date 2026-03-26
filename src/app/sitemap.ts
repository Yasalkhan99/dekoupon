import type { MetadataRoute } from "next";
import { categories, blogCategorySlug } from "@/data/blog";
import { STORE_CATEGORIES } from "@/data/categories";
import { SPECIAL_EVENTS } from "@/data/events";
import { readBlogPosts } from "@/lib/blog";
import { getSiteOrigin } from "@/lib/site";
import { getStores, slugify } from "@/lib/stores";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATIC_PATHS: string[] = [
  "/",
  "/about",
  "/contact",
  "/imprint",
  "/promotions",
  "/promotions/brands",
  "/promotions/categories",
  "/promotions/share-a-coupon",
];

function lastMod(d?: string | null): Date {
  if (!d) return new Date();
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? new Date() : new Date(t);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteOrigin();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const path of STATIC_PATHS) {
    const url = path === "/" ? `${base}/` : `${base}${path}`;
    entries.push({
      url,
      lastModified: now,
      changeFrequency: path === "/" ? "daily" : "weekly",
      priority: path === "/" ? 1 : 0.85,
    });
  }

  try {
    const posts = await readBlogPosts();
    const blogSeen = new Set<string>();
    for (const p of posts) {
      const slug = (p.slug || "").trim();
      if (!slug) continue;
      const url = `${base}/blog/${encodeURIComponent(slug)}`;
      if (blogSeen.has(url)) continue;
      blogSeen.add(url);
      entries.push({
        url,
        lastModified: lastMod(p.createdAt),
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }
  } catch {
    // ignore
  }

  for (const c of categories) {
    entries.push({
      url: `${base}/blog/category/${blogCategorySlug(c)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.65,
    });
  }

  for (const sc of STORE_CATEGORIES) {
    entries.push({
      url: `${base}/promotions/category/${sc.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.65,
    });
  }
  entries.push({
    url: `${base}/promotions/category/other`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  });

  try {
    const stores = await getStores();
    const seen = new Set<string>();
    for (const s of stores) {
      if (s.status === "disable") continue;
      const raw = (s.slug || slugify(s.name || "store")).trim();
      if (!raw) continue;
      const url = `${base}/promotions/${encodeURIComponent(raw)}`;
      if (seen.has(url)) continue;
      seen.add(url);
      entries.push({
        url,
        lastModified: lastMod(s.createdAt),
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  } catch {
    // ignore
  }

  for (const e of SPECIAL_EVENTS) {
    entries.push({
      url: `${base}/deals/${e.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  const byUrl = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const e of entries) {
    byUrl.set(e.url, e);
  }
  return Array.from(byUrl.values());
}
