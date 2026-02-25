import { NextResponse } from "next/server";
import { getSupabase, SUPABASE_BLOG_TABLE, SUPABASE_UPLOADS_BUCKET } from "@/lib/supabase-server";

/**
 * GET /api/supabase-check
 * Live pe check karne ke liye: kya Supabase connect hai, blog table + storage accessible?
 * Secret return nahi hota, sirf status.
 */
export async function GET() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)?.trim();
  const hasKey = !!(
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY)?.trim()
  );

  if (!url || !hasKey) {
    return NextResponse.json({
      ok: false,
      reason: "env_missing",
      message: "NEXT_PUBLIC_SUPABASE_URL ya SUPABASE_SERVICE_ROLE_KEY missing. Vercel → Settings → Environment Variables check karo, phir Redeploy.",
      hasUrl: !!url,
      hasKey,
    });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({
      ok: false,
      reason: "client_failed",
      message: "Supabase client ban nahi paya. URL/key invalid ho sakte hain.",
    });
  }

  const errors: string[] = [];

  const { error: blogErr } = await supabase.from(SUPABASE_BLOG_TABLE).select("id").limit(1);
  if (blogErr) errors.push(`blog_posts: ${blogErr.message}`);

  const { error: storageErr } = await supabase.storage.from(SUPABASE_UPLOADS_BUCKET).list("", { limit: 1 });
  if (storageErr) errors.push(`storage uploads: ${storageErr.message}`);

  if (errors.length > 0) {
    return NextResponse.json({
      ok: false,
      reason: "supabase_error",
      message: "Supabase connect hai lekin table/bucket access fail.",
      errors,
    });
  }

  return NextResponse.json({
    ok: true,
    message: "Supabase theek hai – blog_posts + uploads bucket dono accessible.",
  });
}
