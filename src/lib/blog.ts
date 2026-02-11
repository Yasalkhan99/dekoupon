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
import { getSupabase, SUPABASE_BLOG_TABLE } from "@/lib/supabase-server";

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

export async function readBlogPosts(): Promise<BlogPostWithContent[]> {
  const supabase = getSupabase();
  let posts: BlogPostWithContent[] = [];

  if (supabase) {
    const { data: rows, error } = await supabase
      .from(SUPABASE_BLOG_TABLE)
      .select("id, data")
      .order("id");
    if (!error && rows?.length) {
      posts = rows.map((r) => r.data as BlogPostWithContent);
    }
  }

  if (posts.length === 0) {
    try {
      const data = await readFile(getBlogPath(), "utf-8");
      posts = JSON.parse(data);
    } catch {
      posts = [];
    }
  }

  const staticPosts = getStaticBlogPosts();
  const existingIds = new Set(posts.map((p) => p.id));
  const existingSlugs = new Set(posts.map((p) => p.slug));
  let merged = posts;
  for (const s of staticPosts) {
    if (existingIds.has(s.id) || existingSlugs.has(s.slug)) continue;
    existingIds.add(s.id);
    existingSlugs.add(s.slug);
    merged = [...merged, { ...s, createdAt: s.createdAt ?? new Date().toISOString(), publishedDate: s.publishedDate ?? "" }];
  }
  if (merged.length > posts.length) {
    await writeBlogPosts(merged);
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

export async function getPostBySlug(slug: string): Promise<BlogPostWithContent | null> {
  const posts = await readBlogPosts();
  return posts.find((p) => p.slug === slug) ?? null;
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
