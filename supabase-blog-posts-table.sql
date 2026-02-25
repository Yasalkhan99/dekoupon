-- Run this in Supabase Dashboard → SQL Editor (for the project you use in Vercel)
-- Creates the blog_posts table so blog, meta title, meta description, featured sab Supabase mein save hon.

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id text PRIMARY KEY,
  data jsonb NOT NULL
);

COMMENT ON TABLE public.blog_posts IS 'Blog posts; data = full post object (title, slug, content, excerpt, image, imageAspectRatio, featured, niche, meta_title, meta_description, publishedDate, createdAt, etc.)';

-- Image uploads ke liye Storage bucket (Dashboard se banao agar nahi hai):
-- Storage → New bucket → name: uploads → Public bucket ✓
