-- Same schema as SavingsHub4u: run once in the new project's Supabase → SQL Editor.
-- Requires: pgcrypto (gen_random_uuid) — enabled by default on Supabase.

-- 1. stores
create table if not exists public.stores (
  id text primary key,
  data jsonb not null
);

-- 2. blog_posts
create table if not exists public.blog_posts (
  id text primary key,
  data jsonb not null
);

comment on table public.blog_posts is 'Blog posts; data = full post object (title, slug, content, excerpt, image, imageAspectRatio, featured, niche, meta_title, meta_description, publishedDate, createdAt, etc.)';

-- 3. coupons
create table if not exists public.coupons (
  id text primary key,
  data jsonb not null
);

-- 4. coupon_clicks
create table if not exists public.coupon_clicks (
  id uuid primary key default gen_random_uuid(),
  store_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists coupon_clicks_store_id_idx on public.coupon_clicks (store_id);
create index if not exists coupon_clicks_created_at_idx on public.coupon_clicks (created_at);

comment on table public.coupon_clicks is 'Counts GET CODE / GET DEAL clicks per coupon (store_id = coupon id).';
