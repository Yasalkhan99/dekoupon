import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { cache } from "react";
import type { BlogPost } from "@/data/blog";
import {
  categories,
  heroPost as staticHero,
  featuredPosts as staticFeatured,
  mostPopularPosts as staticMostPopular,
  latestPosts as staticLatest,
} from "@/data/blog";
import type { NavDropdownPost } from "@/data/blog";
import { getSupabase, SUPABASE_BLOG_TABLE, SUPABASE_UPLOADS_BUCKET } from "@/lib/supabase-server";
import { fetchSanityBlogPosts, fetchSanityPostBySlug } from "@/lib/sanity";

const DEFAULT_FEATURED_IMAGE = "https://picsum.photos/id/1/1200/600";
const SITE_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://savingshub4u.com";

/**
 * Resolve featured image URL so it works on both local and live.
 * - Localhost or relative /uploads/ URLs are resolved to Supabase public URL when available (so live can load the same image).
 * - Relative paths are prefixed with site base URL.
 */
export function getBlogFeaturedImageUrl(imageUrl: string | undefined): string {
  const raw = (imageUrl || "").trim();
  if (!raw) return DEFAULT_FEATURED_IMAGE;

  const isLocalhost = /^https?:\/\/localhost(\d*)(\/|$)/i.test(raw) || /^https?:\/\/127\.0\.0\.1(\d*)(\/|$)/i.test(raw);
  const isRelativeUpload = raw.startsWith("/uploads/");

  if (isLocalhost || isRelativeUpload) {
    const supabase = getSupabase();
    if (supabase) {
      const filename = raw.replace(/^.*\/uploads\//i, "").replace(/\?.*$/, "").trim();
      if (filename) {
        const { data } = supabase.storage.from(SUPABASE_UPLOADS_BUCKET).getPublicUrl(filename);
        return data.publicUrl;
      }
    }
    if (isRelativeUpload) return `${SITE_BASE_URL.replace(/\/$/, "")}${raw}`;
  }

  // Public folder paths (/undefined.png, /banner.jpg etc.) – same origin pe rahen taake featured image dikhe
  if (raw.startsWith("/")) return raw;
  return raw;
}

/**
 * Resolve image URLs inside blog content HTML so images (and links wrapping them) work on live.
 * Replaces localhost and /uploads/ in img src with Supabase public URL when available.
 */
export function resolveContentImageUrls(html: string): string {
  const supabase = getSupabase();
  if (!supabase) return html;

  return html.replace(/<img([^>]*)\ssrc=["']([^"']+)["']/gi, (_, attrs, src) => {
    const trimmed = (src || "").trim();
    const isLocalhost = /^https?:\/\/localhost(\d*)(\/|$)/i.test(trimmed) || /^https?:\/\/127\.0\.0\.1(\d*)(\/|$)/i.test(trimmed);
    const isRelativeUpload = trimmed.startsWith("/uploads/");
    if (!isLocalhost && !isRelativeUpload) return `<img${attrs} src="${src}"`;

    const filename = trimmed.replace(/^.*\/uploads\//i, "").replace(/\?.*$/, "").trim();
    if (!filename) return `<img${attrs} src="${src}"`;

    const { data } = supabase.storage.from(SUPABASE_UPLOADS_BUCKET).getPublicUrl(filename);
    return `<img${attrs} src="${data.publicUrl}"`;
  });
}

export type BlogPostWithContent = BlogPost & {
  content?: string;
  createdAt?: string;
  publishedDate?: string;
};

const getBlogPath = () => path.join(process.cwd(), "data", "blog.json");

/** All static posts from data/blog.ts (unique by id) – used to fill blog.json if missing. */
function getStaticBlogPosts(): BlogPostWithContent[] {
  const byId = new Map<string, BlogPostWithContent>();
  const add = (p: BlogPost) => {
    if (!byId.has(p.id)) {
      byId.set(p.id, {
        ...p,
        content: "",
        createdAt: new Date(0).toISOString(),
        publishedDate: "",
      });
    }
  };
  add(staticHero);
  staticFeatured.forEach(add);
  staticMostPopular.forEach(add);
  staticLatest.forEach(add);
  return Array.from(byId.values());
}

/** Load posts from data/blog.json (file). Used so file-based posts always show on frontend. */
async function readFileBlogPosts(): Promise<BlogPostWithContent[]> {
  try {
    const data = await readFile(getBlogPath(), "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function readBlogPosts(): Promise<BlogPostWithContent[]> {
  // 1) File se pehle load karo – frontend pe blog.json posts hamesha dikhain (meta + content)
  const filePosts = await readFileBlogPosts();
  const existingIds = new Set<string>(filePosts.map((p) => p.id));
  const existingSlugs = new Set<string>(filePosts.map((p) => p.slug));
  let merged: BlogPostWithContent[] = [...filePosts];

  // 2) Supabase optional – agar chaho to Supabase posts bhi merge kar sakte ho (abhi skip, sirf file)
  const supabase = getSupabase();
  if (supabase) {
    const { data: rows, error } = await supabase
      .from(SUPABASE_BLOG_TABLE)
      .select("id, data")
      .order("id");
    if (!error && rows?.length) {
      for (const r of rows) {
        const p = r.data as BlogPostWithContent;
        if (existingIds.has(p.id) || existingSlugs.has(p.slug)) continue;
        existingIds.add(p.id);
        existingSlugs.add(p.slug);
        merged.push(p);
      }
    }
  }

  // 3) Sanity CMS posts – merge new ones that don't already exist in file/Supabase
  const sanityPosts = await fetchSanityBlogPosts();
  for (const sp of sanityPosts) {
    if (existingIds.has(sp.id) || existingSlugs.has(sp.slug)) continue;
    existingIds.add(sp.id);
    existingSlugs.add(sp.slug);
    merged.push(sp as BlogPostWithContent);
  }

  // 4) Static posts from blog.ts (fallback when file empty)
  const staticPosts = getStaticBlogPosts();
  for (const s of staticPosts) {
    if (existingIds.has(s.id) || existingSlugs.has(s.slug)) continue;
    existingIds.add(s.id);
    existingSlugs.add(s.slug);
    merged.push({ ...s, createdAt: s.createdAt ?? new Date().toISOString(), publishedDate: s.publishedDate ?? "" });
  }

  return merged;
}

export async function writeBlogPosts(posts: BlogPostWithContent[]) {
  const supabase = getSupabase();
  if (supabase) {
    const { error: delErr } = await supabase.from(SUPABASE_BLOG_TABLE).delete().neq("id", "");
    if (delErr) throw new Error(`Supabase delete: ${delErr.message}`);
    if (posts.length > 0) {
      const rows = posts.map((p) => ({ id: p.id, data: p }));
      const { error: insertErr } = await supabase.from(SUPABASE_BLOG_TABLE).insert(rows);
      if (insertErr) throw new Error(`Supabase insert: ${insertErr.message}`);
    }
    return;
  }
  const filePath = getBlogPath();
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, JSON.stringify(posts, null, 2), "utf-8");
}

/** Update a single post by id (fast path for PATCH – no delete-all/insert-all). */
export async function updateSingleBlogPost(id: string, post: BlogPostWithContent) {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase
      .from(SUPABASE_BLOG_TABLE)
      .update({ data: post })
      .eq("id", id);
    if (error) throw new Error(`Supabase update: ${error.message}`);
    return;
  }
  const filePath = getBlogPath();
  let posts: BlogPostWithContent[];
  try {
    const data = await readFile(filePath, "utf-8");
    posts = JSON.parse(data);
  } catch {
    posts = await readBlogPosts();
  }
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Post not found");
  posts[idx] = post;
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, JSON.stringify(posts, null, 2), "utf-8");
}

export async function getPostBySlug(slug: string): Promise<BlogPostWithContent | null> {
  const posts = await readBlogPosts();
  const fromMerged = posts.find((p) => p.slug === slug);
  if (fromMerged) return fromMerged;
  const fromSanity = await fetchSanityPostBySlug(slug);
  return fromSanity ? (fromSanity as BlogPostWithContent) : null;
}

export async function getPostsByCategory(category: string): Promise<BlogPostWithContent[]> {
  const posts = await readBlogPosts();
  return posts
    .filter((p) => p.category === category)
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
}

export type BlogData = {
  heroPost: BlogPostWithContent;
  featuredPosts: BlogPostWithContent[];
  mostPopularPosts: BlogPostWithContent[];
  latestPosts: BlogPostWithContent[];
  trendingPosts: BlogPostWithContent[];
  /** Many posts for hero flow (featured + trending + popular), colorful section */
  heroFlowPosts: BlogPostWithContent[];
  footerCategories: { name: string; posts: BlogPostWithContent[] }[];
  navDropdownPosts: Record<string, NavDropdownPost[]>;
  allPosts: BlogPostWithContent[];
};

function hasNiche(p: BlogPostWithContent, n: "featured" | "trending" | "popular"): boolean {
  if (p.niche?.includes(n)) return true;
  if (n === "featured" && p.featured) return true;
  return false;
}

export const getBlogData = cache(async (): Promise<BlogData> => {
  const posts = await readBlogPosts();
  const sorted = [...posts].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );
  const featured = posts.filter((p) => hasNiche(p, "featured"));
  const heroPost = featured[0] ?? sorted[0];
  const featuredPosts = featured.slice(0, 3);
  const withPopular = posts.filter((p) => hasNiche(p, "popular"));
  const withTrending = posts.filter((p) => hasNiche(p, "trending"));
  const mostPopularPosts = withPopular.length > 0 ? withPopular.slice(0, 10) : sorted.slice(0, 10);
  const latestPosts = sorted.slice(0, 6);
  const trendingPosts = withTrending.length > 0 ? withTrending.slice(0, 6) : sorted.slice(0, 6);
  const seenIds = new Set<string>();
  const heroFlowPosts: BlogPostWithContent[] = [];
  for (const p of [...featured, ...withTrending, ...withPopular]) {
    if (seenIds.has(p.id)) continue;
    seenIds.add(p.id);
    heroFlowPosts.push(p);
  }
  for (const p of sorted) {
    if (heroFlowPosts.length >= 18) break;
    if (seenIds.has(p.id)) continue;
    seenIds.add(p.id);
    heroFlowPosts.push(p);
  }
  const withDate = (p: BlogPostWithContent, date: string): NavDropdownPost => ({
    ...p,
    date: p.publishedDate ?? date,
  });
  const navDropdownPosts: Record<string, NavDropdownPost[]> = {
    fashion: mostPopularPosts.slice(0, 4).map((p, i) => withDate(p, ["JANUARY 2, 2026", "DECEMBER 6, 2025", "DECEMBER 2, 2025", "NOVEMBER 17, 2025"][i] ?? "")),
    lifestyle: mostPopularPosts.slice(1, 5).map((p, i) => withDate(p, ["JANUARY 5, 2026", "DECEMBER 2, 2025", "DECEMBER 28, 2025", "DECEMBER 20, 2025"][i] ?? "")),
    featured: [heroPost, ...mostPopularPosts.slice(0, 3)].map((p, i) => withDate(p, ["JANUARY 2, 2026", "DECEMBER 10, 2025", "JANUARY 1, 2026", "DECEMBER 15, 2025"][i] ?? "")),
  };
  const footerCategories = [
    { name: "FASHION", posts: mostPopularPosts.slice(0, 4) },
    { name: "HOME & OUTDOOR", posts: mostPopularPosts.slice(1, 5) },
    { name: "LIFESTYLE", posts: latestPosts.slice(1, 5) },
    { name: "BEAUTY", posts: mostPopularPosts.filter((p) => p.category.includes("BEAUTY")).slice(0, 4) },
  ];
  const fallbackHero: BlogPostWithContent = {
    id: "",
    title: "No posts yet",
    excerpt: "Add posts from Admin → Blog.",
    category: "NEWS",
    slug: "",
    image: "https://picsum.photos/id/1/1200/600",
    featured: false,
  };
  return {
    heroPost: heroPost ?? fallbackHero,
    featuredPosts,
    mostPopularPosts,
    latestPosts,
    trendingPosts,
    heroFlowPosts,
    footerCategories,
    navDropdownPosts,
    allPosts: posts,
  };
});

const fallbackHeroStatic: BlogPostWithContent = {
  id: "",
  title: "No posts yet",
  excerpt: "Add posts from Admin → Blog.",
  category: "NEWS",
  slug: "",
  image: "https://picsum.photos/id/1/1200/600",
  featured: false,
};

/** Default blog data when getBlogData fails (e.g. admin route or missing file). */
export function getDefaultBlogData(): BlogData {
  return {
    heroPost: fallbackHeroStatic,
    featuredPosts: [],
    mostPopularPosts: [],
    latestPosts: [],
    trendingPosts: [],
    heroFlowPosts: [],
    footerCategories: [],
    navDropdownPosts: { fashion: [], lifestyle: [], featured: [] },
    allPosts: [],
  };
}

export { categories };
