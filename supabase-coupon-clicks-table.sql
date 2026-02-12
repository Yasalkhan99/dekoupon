-- Coupon/store page click tracking (GET CODE / GET DEAL).
-- Run this in Supabase SQL Editor if the table doesn't exist yet.

create table if not exists public.coupon_clicks (
  id uuid primary key default gen_random_uuid(),
  store_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists coupon_clicks_store_id_idx on public.coupon_clicks (store_id);
create index if not exists coupon_clicks_created_at_idx on public.coupon_clicks (created_at);

comment on table public.coupon_clicks is 'Counts GET CODE / GET DEAL clicks per coupon (store_id = coupon id) for SavingsHub4u store pages.';
