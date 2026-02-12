import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serverSupabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)?.trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY)?.trim();
  if (!url || !key) return null;
  if (!serverSupabase) {
    serverSupabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return serverSupabase;
}

export const SUPABASE_STORES_TABLE = "stores";
export const SUPABASE_COUPONS_TABLE = "coupons";
export const SUPABASE_BLOG_TABLE = "blog_posts";
/** Storage bucket for blog image uploads (must be public so URLs work). */
export const SUPABASE_UPLOADS_BUCKET = "uploads";
/** Coupon/store page click tracking (GET CODE / GET DEAL). */
export const SUPABASE_CLICKS_TABLE = "coupon_clicks";
