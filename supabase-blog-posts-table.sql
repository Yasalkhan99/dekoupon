-- Run this in Supabase Dashboard → SQL Editor (for the project you use in Vercel)
-- Creates the blog_posts table so live blog save works.

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id text PRIMARY KEY,
  data jsonb NOT NULL
);

COMMENT ON TABLE public.blog_posts IS 'Blog posts for SavingsHub4u; data = full post object (title, slug, content, etc.)';

-- Also create a Storage bucket for blog image uploads (live/Vercel):
-- 1. Go to Supabase Dashboard → Storage → New bucket
-- 2. Name: uploads
-- 3. Enable "Public bucket" so image URLs work
-- 4. Create bucket
