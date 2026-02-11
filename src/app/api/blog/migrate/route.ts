import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { verifySession, getCookieName } from "@/lib/admin-auth";
import { getSupabase, SUPABASE_BLOG_TABLE } from "@/lib/supabase-server";
import type { BlogPostWithContent } from "@/lib/blog";

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(getCookieName())?.value;
  return cookie ? verifySession(cookie) : false;
}

/**
 * One-time: copy blog posts from data/blog.json into Supabase.
 * Call POST /api/blog/migrate once (as admin) after setting Supabase env on Vercel.
 */
export async function POST() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel." },
        { status: 503 }
      );
    }
    let posts: BlogPostWithContent[];
    try {
      const filePath = path.join(process.cwd(), "data", "blog.json");
      const data = await readFile(filePath, "utf-8");
      posts = JSON.parse(data);
    } catch {
      return NextResponse.json(
        { error: "Could not read data/blog.json. Run migrate from a environment where the file exists (e.g. local or first deploy)." },
        { status: 400 }
      );
    }
    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ migrated: 0, message: "No posts in blog.json." });
    }
    const { error: delErr } = await supabase.from(SUPABASE_BLOG_TABLE).delete().neq("id", "");
    if (delErr) {
      return NextResponse.json({ error: `Supabase delete: ${delErr.message}` }, { status: 500 });
    }
    const rows = posts.map((p) => ({ id: p.id, data: p }));
    const { error: insertErr } = await supabase.from(SUPABASE_BLOG_TABLE).insert(rows);
    if (insertErr) {
      return NextResponse.json({ error: `Supabase insert: ${insertErr.message}` }, { status: 500 });
    }
    return NextResponse.json({ migrated: posts.length, message: "Blog posts copied to Supabase." });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
