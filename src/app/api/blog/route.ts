import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, getCookieName } from "@/lib/admin-auth";
import {
  readBlogPosts,
  writeBlogPosts,
  getPostBySlug,
  type BlogPostWithContent,
} from "@/lib/blog";
import { categories } from "@/data/blog";

const allowedFields = [
  "title",
  "excerpt",
  "category",
  "slug",
  "image",
  "imageAspectRatio",
  "featured",
  "niche",
  "content",
  "createdAt",
  "publishedDate",
  "meta_title",
  "meta_description",
] as const;

const VALID_NICHES = ["featured", "trending", "popular"] as const;

function slugFromTitle(title: string): string {
  return String(title)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    if (slug) {
      const post = await getPostBySlug(slug);
      if (!post) return NextResponse.json(null, { status: 404 });
      return NextResponse.json(post);
    }
    const posts = await readBlogPosts();
    return NextResponse.json(posts);
  } catch (e) {
    return NextResponse.json({ error: "Failed to load blog" }, { status: 500 });
  }
}

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(getCookieName())?.value;
  return cookie ? verifySession(cookie) : false;
}

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const title = body.title != null ? String(body.title).trim() : "";
    if (!title) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }
    const slug =
      body.slug != null && String(body.slug).trim() !== ""
        ? String(body.slug).trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
        : slugFromTitle(title);
    const posts = await readBlogPosts();
    if (posts.some((p) => p.slug === slug)) {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 400 });
    }
    const now = new Date().toISOString();
    const publishedDate =
      body.publishedDate != null && String(body.publishedDate).trim() !== ""
        ? String(body.publishedDate).trim()
        : new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toUpperCase();
    const nicheRaw = body.niche;
    const niche: ("featured" | "trending" | "popular")[] = Array.isArray(nicheRaw)
      ? nicheRaw.filter((n: unknown) => typeof n === "string" && VALID_NICHES.includes(n as typeof VALID_NICHES[number]))
      : body.featured === true ? ["featured"] : [];
    const newPost: BlogPostWithContent = {
      id: crypto.randomUUID(),
      title,
      excerpt: body.excerpt != null ? String(body.excerpt).trim() : "",
      category: body.category != null && categories.includes(body.category) ? body.category : categories[0],
      slug,
      image: body.image != null ? String(body.image).trim() : "",
      imageAspectRatio: ["auto", "1/1", "4/3", "3/2", "16/9", "21/9"].includes(body.imageAspectRatio) ? body.imageAspectRatio : undefined,
      featured: body.featured === true || niche.includes("featured"),
      niche: niche.length ? niche : undefined,
      content: body.content != null ? String(body.content).trim() : "",
      createdAt: now,
      publishedDate,
      ...(body.meta_title != null && String(body.meta_title).trim() !== "" && { meta_title: String(body.meta_title).trim() }),
      ...(body.meta_description != null && String(body.meta_description).trim() !== "" && { meta_description: String(body.meta_description).trim() }),
    };
    posts.push(newPost);
    try {
      await writeBlogPosts(posts);
    } catch (writeErr) {
      const err = writeErr as NodeJS.ErrnoException;
      const isReadOnly =
        typeof err?.code === "string" && (err.code === "EROFS" || err.code === "EACCES");
      const msg = isReadOnly
        ? "Blog cannot be updated on this deployment (read-only server). Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel so blog saves to Supabase."
        : `Failed to save blog. ${err instanceof Error ? err.message : String(err)}`;
      return NextResponse.json({ error: msg }, { status: 503 });
    }
    return NextResponse.json(newPost);
  } catch (e) {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const id = body.id;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const posts = await readBlogPosts();
    const index = posts.findIndex((p) => p.id === id);
    if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const current = posts[index];
    const nextPost = { ...current };
    for (const key of allowedFields) {
      if (key in body && body[key] !== undefined) {
        (nextPost as Record<string, unknown>)[key] =
          typeof body[key] === "string" ? body[key].trim() : body[key];
      }
    }
    if (body.slug != null && String(body.slug).trim() !== "") {
      nextPost.slug = String(body.slug).trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    }
    if (body.category != null && categories.includes(body.category)) {
      nextPost.category = body.category;
    }
    if (body.niche !== undefined) {
      const arr = Array.isArray(body.niche) ? body.niche : [];
      const filtered = arr.filter((n: unknown) => typeof n === "string" && VALID_NICHES.includes(n as typeof VALID_NICHES[number]));
      nextPost.niche = filtered.length === 0 ? undefined : filtered;
      nextPost.featured = nextPost.featured || (nextPost.niche != null && nextPost.niche.includes("featured"));
    }
    const validAspect = ["auto", "1/1", "4/3", "3/2", "16/9", "21/9"];
    if (body.imageAspectRatio !== undefined) {
      (nextPost as Record<string, unknown>).imageAspectRatio = validAspect.includes(body.imageAspectRatio) ? body.imageAspectRatio : undefined;
    }
    posts[index] = nextPost;
    try {
      await writeBlogPosts(posts);
    } catch (writeErr) {
      const err = writeErr as NodeJS.ErrnoException;
      const isReadOnly =
        typeof err?.code === "string" && (err.code === "EROFS" || err.code === "EACCES");
      const msg = isReadOnly
        ? "Blog cannot be updated on this deployment (read-only server). Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel so blog saves to Supabase."
        : `Failed to save blog. ${err instanceof Error ? err.message : String(err)}`;
      return NextResponse.json({ error: msg }, { status: 503 });
    }
    return NextResponse.json(nextPost);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const posts = await readBlogPosts();
    const nextPosts = posts.filter((p) => p.id !== id);
    if (nextPosts.length === posts.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    try {
      await writeBlogPosts(nextPosts);
    } catch (writeErr) {
      const err = writeErr as NodeJS.ErrnoException;
      const isReadOnly =
        typeof err?.code === "string" && (err.code === "EROFS" || err.code === "EACCES");
      const msg = isReadOnly
        ? "Blog cannot be updated on this deployment (read-only server). Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel so blog saves to Supabase."
        : `Failed to save blog. ${err instanceof Error ? err.message : String(err)}`;
      return NextResponse.json({ error: msg }, { status: 503 });
    }
    return NextResponse.json({ deleted: 1 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
