import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { preload } from "react-dom";
import PromotionsFooter from "@/components/PromotionsFooter";
import PromotionsHeroSearch from "@/components/PromotionsHeroSearch";
import CategoryIcon from "@/components/CategoryIcon";
import Pagination from "@/components/Pagination";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import {
  getStoresCached,
  getCouponsCached,
  slugify,
  canonicalSlug,
  hasCouponData,
  precomputeSlugMatchFields,
  slugMatchesFromFields,
} from "@/lib/stores";
import { getCachedBlogData } from "@/lib/blog";
import { stripHtml } from "@/lib/slugify";
import { STORE_CATEGORIES } from "@/data/categories";
import { getBlogImageAspectClass, type ImageAspectRatio } from "@/data/blog";
import type { Store } from "@/types/store";
import { canonicalUrl } from "@/lib/site";

export const revalidate = 120;

export const metadata: Metadata = {
  title: { absolute: "Latest Promotions & Exclusive Deals | SavingsHub4U" },
  description:
    "Explore the latest promotions, limited-time offers, and exclusive online deals at SavingsHub4U. Save big on travel, fashion, electronics, food delivery, and more with updated discounts added daily.",
  alternates: { canonical: canonicalUrl("/promotions") },
};

const PER_PAGE = 24;
const POPULAR_COUPONS_COUNT = 6;
const TOP_STORES_COUNT = 12;
const TRENDING_CATEGORIES_COUNT = 12;

function buildUniqueStoresAndCouponCounts(enabled: Store[]) {
  const storeKeyToRow = new Map<string, Store>();
  const couponCountByKey = new Map<string, number>();

  for (const row of enabled) {
    const rawSlug = (row.slug || slugify(row.name)).toLowerCase().trim() || (row.name ?? "").toLowerCase().trim();
    if (!rawSlug) continue;
    const key = canonicalSlug(rawSlug);

    if (hasCouponData(row)) {
      couponCountByKey.set(key, (couponCountByKey.get(key) ?? 0) + 1);
    }

    const existing = storeKeyToRow.get(key);
    if (!existing) {
      storeKeyToRow.set(key, row);
      continue;
    }
    const rowIsCoupon = hasCouponData(row);
    const existingIsCoupon = hasCouponData(existing);
    if (rowIsCoupon && !existingIsCoupon) continue;
    if (!rowIsCoupon && existingIsCoupon) storeKeyToRow.set(key, row);
  }

  const uniqueStores = Array.from(storeKeyToRow.values());
  const getCouponCount = (store: Store) => {
    const rawSlug = (store.slug || slugify(store.name)).toLowerCase().trim() || (store.name ?? "").toLowerCase().trim();
    return couponCountByKey.get(canonicalSlug(rawSlug)) ?? 0;
  };

  return { uniqueStores, getCouponCount };
}

function filterStoresByQuery(stores: Store[], query: string): Store[] {
  if (!query) return stores;
  const q = query.trim().toLowerCase();
  if (!q) return stores;
  return stores.filter((s) => {
    const name = (s.name ?? "").toLowerCase();
    const sub = (s.subStoreName ?? "").toLowerCase();
    const slug = (s.slug ?? slugify(s.name ?? "")).toLowerCase();
    // Match stores that START with the search letter (e.g. "a" → Amazon, ASOS, not Texas Roadhouse)
    return name.startsWith(q) || sub.startsWith(q) || slug.startsWith(q);
  });
}

export default async function PromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  /** Same-origin LCP hero — pairs with middleware Link preload + visible <img fetchPriority="high">. */
  preload("/banner-index-2.webp", { as: "image", fetchPriority: "high" });

  const { page: pageStr, q: searchQuery } = await searchParams;
  const currentPage = Math.max(1, parseInt(String(pageStr || "1"), 10) || 1);
  const [allRows, allCouponsFromTable, { featuredPosts }] = await Promise.all([
    getStoresCached(),
    getCouponsCached(),
    getCachedBlogData(),
  ]);
  const enabled = allRows.filter((s) => s.status !== "disable");
  const { uniqueStores, getCouponCount: getCouponCountFromStores } = buildUniqueStoresAndCouponCounts(enabled);
  const searchFilteredStores = filterStoresByQuery(uniqueStores, searchQuery ?? "");

  const enabledCoupons = allCouponsFromTable.filter((c) => c.status !== "disable");
  const couponFields = enabledCoupons.map((c) => precomputeSlugMatchFields(c));
  const couponCountByKey = new Map<string, number>();
  for (const store of uniqueStores) {
    const wantRaw = (store.slug || slugify(store.name)).toLowerCase().trim() || (store.name ?? "").toLowerCase().trim();
    if (!wantRaw) continue;
    const key = canonicalSlug(wantRaw);
    let count = 0;
    for (let i = 0; i < couponFields.length; i++) {
      if (slugMatchesFromFields(couponFields[i], wantRaw, key)) count += 1;
    }
    couponCountByKey.set(key, count);
  }
  const getCouponCount = (store: Store) => {
    const fromStores = getCouponCountFromStores(store);
    const rawSlug = (store.slug || slugify(store.name)).toLowerCase().trim() || (store.name ?? "").toLowerCase().trim();
    const fromCouponsTable = couponCountByKey.get(canonicalSlug(rawSlug)) ?? 0;
    return fromStores + fromCouponsTable;
  };

  const withCoupons = [...uniqueStores].filter((s) => getCouponCount(s) > 0);
  const byCount = (a: (typeof uniqueStores)[0], b: (typeof uniqueStores)[0]) => getCouponCount(b) - getCouponCount(a);
  const trendingWithCoupons = withCoupons.filter((s) => s.trending === true).sort(byCount);
  const othersWithCoupons = withCoupons.filter((s) => s.trending !== true).sort((a, b) => (a.id ?? "").localeCompare(b.id ?? ""));
  const popularCouponsStores = [...trendingWithCoupons, ...othersWithCoupons].slice(0, POPULAR_COUPONS_COUNT);

  const topStores = uniqueStores.slice(0, TOP_STORES_COUNT);
  const trendingCategories = STORE_CATEGORIES.slice(0, TRENDING_CATEGORIES_COUNT);

  const totalPages = Math.max(1, Math.ceil(searchFilteredStores.length / PER_PAGE));
  const pageStores = searchFilteredStores.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <>
      {/* Hero — full-width band; copy + search left, overlapping visuals right (LCP img stays in DOM early). */}
      <section className="relative overflow-visible border-b border-emerald-900/10 bg-gradient-to-br from-zinc-900 via-emerald-950 to-zinc-900 px-4 py-12 text-white sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="relative z-10 min-w-0 lg:col-span-5 xl:col-span-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/90">Deals &amp; codes</p>
              <h1 className="text-pretty text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.35rem] xl:text-5xl">
                Discover the best{" "}
                <span className="text-emerald-300">affiliate coupons</span> &amp; promos
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
                Save on your favorite brands with verified codes, limited-time offers, and hand-picked deals — updated regularly.
              </p>
              <div className="mt-8 max-w-xl [&_.rounded-2xl]:border-white/20 [&_.rounded-2xl]:bg-white/95 [&_input]:text-zinc-900">
                <PromotionsHeroSearch initialQuery={searchQuery ?? ""} />
              </div>
            </div>

            <div className="relative z-0 mx-auto min-h-[260px] w-full max-w-md lg:col-span-7 xl:col-span-7 lg:mx-0 lg:max-w-none lg:min-h-[320px]">
              <div className="pointer-events-none absolute -right-4 top-0 aspect-[3/4] w-[58%] max-w-[220px] overflow-hidden rounded-2xl shadow-2xl ring-2 ring-white/10 sm:max-w-[260px] lg:right-0 lg:max-w-[280px]">
                <img
                  src="/banner-index-2.webp"
                  alt="Best affiliate coupons and discounts"
                  width={512}
                  height={768}
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 aspect-[3/4] w-[52%] max-w-[200px] overflow-hidden rounded-2xl shadow-xl ring-2 ring-emerald-400/30 sm:max-w-[240px] lg:left-4 lg:max-w-[260px]">
                <img
                  src="/banner-index-1.webp"
                  alt="Save with coupons and deals"
                  width={416}
                  height={624}
                  fetchPriority="low"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute inset-x-8 bottom-3 hidden rounded-xl bg-black/25 px-3 py-2 text-center text-[11px] font-medium text-white/90 backdrop-blur-sm sm:block lg:inset-x-12">
                Search stores above — results open on this page
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="min-w-0 space-y-14">
        {/* Popular Coupons */}
        <section id="popular-coupons">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-emerald-900/10 pb-4">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              Popular Coupons
            </h2>
            <Link
              href="#all-stores"
              className="text-sm font-semibold text-[var(--footer-accent)] hover:underline"
            >
              Jump to all stores →
            </Link>
          </div>
          {popularCouponsStores.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 py-12 text-center">
              <p className="text-sm text-zinc-500">No coupons yet. Add stores and coupons from the admin.</p>
              <Link href="/admin" className="mt-3 inline-block text-sm font-medium text-[var(--footer-accent)] hover:underline">Go to Admin</Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {popularCouponsStores.map((store) => {
                const count = getCouponCount(store);
                const storeSlug = store.slug || slugify(store.name);
                return (
                  <article
                    key={store.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                    suppressHydrationWarning
                  >
                    <div className="flex items-start gap-4">
                      {store.logoUrl ? (
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-50">
                          <Image
                            src={store.logoUrl}
                            alt={store.name}
                            fill
                            className="object-contain"
                            sizes="56px"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-lg font-bold text-zinc-500">
                          {(store.name ?? "?")[0]}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-zinc-900 line-clamp-1">
                          {store.couponTitle || `${store.name} Coupons`}
                        </h3>
                        <p className="mt-0.5 line-clamp-2 text-sm text-zinc-600">
                          {store.description}
                        </p>
                      </div>
                    </div>
                    <div
                      className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500"
                      suppressHydrationWarning
                    >
                      <span>Expires: {store.expiry}</span>
                      <span>{count} Coupon{count !== 1 ? "s" : ""}</span>
                    </div>
                    <Link
                      href={`/promotions/${storeSlug}`}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-[var(--footer-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--footer-accent-hover)]"
                    >
                      Get Code
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Top Stores */}
        <section className="mb-14">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              Top Stores
            </h2>
            <Link
              href="/promotions/brands"
              className="text-sm font-semibold text-[var(--footer-accent)] hover:underline"
            >
              View More →
            </Link>
          </div>
          {topStores.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 py-12 text-center text-sm text-zinc-500">
              No stores yet.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {topStores.map((store) => (
                <Link
                  key={store.id}
                  href={`/promotions/${store.slug || slugify(store.name)}`}
                  className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-emerald-200/90 hover:shadow-md"
                >
                  {store.logoUrl ? (
                    <div className="relative h-14 w-14">
                      <Image
                        src={store.logoUrl}
                        alt={store.name}
                        fill
                        className="object-contain"
                        sizes="56px"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-100 text-lg font-bold text-zinc-500">
                      {(store.name ?? "?")[0]}
                    </div>
                  )}
                  <span className="text-center text-xs font-medium text-zinc-700 line-clamp-2">
                    {store.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Trending Categories - peach */}
        <section className="mb-14 rounded-2xl border border-emerald-900/10 bg-[var(--card-bg)] px-6 py-10 sm:px-8 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              Trending Categories
            </h2>
            <Link
              href="/promotions/categories"
              className="text-sm font-semibold text-[var(--footer-accent)] hover:underline"
            >
              View More →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {trendingCategories.map(({ name, slug: catSlug }) => (
              <Link
                key={catSlug}
                href={`/promotions/category/${catSlug}`}
                className="flex items-center gap-4 rounded-xl border border-emerald-100/90 bg-white p-4 transition hover:border-emerald-300/70 hover:shadow-sm"
              >
                <CategoryIcon
                  categoryName={name}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700"
                />
                <span className="font-medium text-zinc-900">{name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-14 rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 px-6 py-12 sm:px-8 lg:px-12 shadow-sm">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight text-zinc-900">
            How It Works
          </h2>
          <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
            <div className="flex flex-col">
              <h3 className="mb-3 text-lg font-bold text-zinc-900">What are coupon codes?</h3>
              <p className="text-sm leading-relaxed text-zinc-700">
                Coupon codes usually consist of numbers and letters that an online shopper can use when checking out on an e-commerce site to get a discount on their purchase.
              </p>
            </div>
            <div className="flex flex-col">
              <h3 className="mb-3 text-lg font-bold text-zinc-900">How can I find the best coupons?</h3>
              <p className="text-sm leading-relaxed text-zinc-700">
                There are many companies that have free coupons for online and in-store money-saving offers. Using SavingsHub4u can help you find the best and largest discounts available online.
              </p>
            </div>
            <div className="flex flex-col">
              <h3 className="mb-3 text-lg font-bold text-zinc-900">How to find promo codes that work.</h3>
              <p className="text-sm leading-relaxed text-zinc-700">
                Save time searching for promo codes that work by using SavingsHub4u. We work with merchants to offer promo codes that will actually work to save you money.
              </p>
            </div>
          </div>
        </section>

        {/* Newsletter banner */}
        <section className="mb-14 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-800 px-6 py-10 text-white sm:px-10 shadow-lg">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Join our newsletter for updates!
              </h2>
              <p className="mt-2 text-sm text-emerald-100">
                Get the best deals and coupon codes delivered to your inbox.
              </p>
            </div>
            <NewsletterSubscribe
              placeholder="Enter your email address"
              buttonText="Subscribe"
              layout="row"
              className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-center"
              inputClassName="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              buttonClassName="rounded-lg bg-white px-6 py-3 font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50"
            />
          </div>
        </section>

        {/* All Coupons - when no search; when search active, results show at top of main */}
        {!searchQuery?.trim() && (
        <section className="mb-14">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              All Coupons & Deals
            </h2>
          </div>
          {uniqueStores.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-16 text-center">
              <p className="mb-2 text-zinc-600">No stores yet. Add coupons and deals from the admin panel.</p>
              <Link href="/admin" className="inline-flex items-center rounded-md bg-[var(--footer-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--footer-accent-hover)]">Go to Admin</Link>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-zinc-500">
                Showing {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, searchFilteredStores.length)} of {searchFilteredStores.length} stores
              </p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pageStores.map((store) => (
                  <article
                    key={store.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-zinc-100 bg-white p-5 shadow-md transition hover:shadow-lg"
                    suppressHydrationWarning
                  >
                    {store.logoUrl ? (
                      <div className="relative mb-4 h-16 w-full" suppressHydrationWarning>
                        <Image
                          src={store.logoUrl}
                          alt={store.name}
                          fill
                          className="object-contain object-left"
                          sizes="200px"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <h3 className="mb-4 text-lg font-bold text-zinc-900">{store.name}</h3>
                    )}
                    <p className="mb-4 flex-1 text-sm text-zinc-600 line-clamp-2">{store.description}</p>
                    <div className="mb-3 text-xs text-zinc-500" suppressHydrationWarning>
                      Expiry: {store.expiry}
                    </div>
                    <Link
                      href={`/promotions/${store.slug || slugify(store.name)}`}
                      className="text-sm font-medium text-[var(--footer-accent)] hover:underline"
                    >
                      View coupons →
                    </Link>
                  </article>
                ))}
              </div>
              <Pagination
                basePath="/promotions"
                currentPage={currentPage}
                totalPages={totalPages}
                searchParams={{
                  ...(pageStr ? { page: pageStr } : {}),
                  ...(searchQuery?.trim() ? { q: searchQuery.trim() } : {}),
                }}
              />
            </>
          )}
        </section>
        )}

        {/* Featured Blogs */}
        <section className="mb-14">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900">
            Featured Blogs
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" suppressHydrationWarning>
            {featuredPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-md transition hover:shadow-lg"
                suppressHydrationWarning
              >
                <div
                  className={`relative w-full overflow-hidden bg-zinc-100 ${getBlogImageAspectClass((post as { imageAspectRatio?: ImageAspectRatio }).imageAspectRatio)}`}
                  suppressHydrationWarning
                >
                  {post.image ? (
                    <Image
                      src={post.image}
                      alt={stripHtml(post.title)}
                      fill
                      className="object-cover transition group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-4" suppressHydrationWarning>
                  <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--footer-accent)]">{post.category}</span>
                  <h3 className="mb-2 line-clamp-2 text-base font-bold text-zinc-900 group-hover:text-[var(--footer-accent)] [&_a]:text-[var(--footer-accent)] [&_a]:underline" dangerouslySetInnerHTML={{ __html: post.title }} />
                  <div
                    className="blog-content mb-3 flex-1 line-clamp-2 text-sm text-zinc-600"
                    dangerouslySetInnerHTML={{ __html: post.excerpt }}
                    suppressHydrationWarning
                  />
                  <span className="text-sm font-medium text-[var(--footer-accent)] group-hover:underline">Read More →</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center" suppressHydrationWarning>
            <Link href="/" className="inline-flex text-sm font-medium text-[var(--footer-accent)] hover:underline">
              View all articles →
            </Link>
          </div>
        </section>
        </div>
      </main>

      {/* Newsletter — same horizontal rhythm as main (max-w-7xl + page padding) */}
      <section className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-800 px-4 py-14 shadow-lg sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-2xl text-center" suppressHydrationWarning>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Join our newsletter for updates!
          </h2>
          <p className="mt-2 text-sm text-emerald-100">
            Join our community with more than 300K active users
          </p>
          <NewsletterSubscribe
            placeholder="Email Address"
            buttonText="Subscribe"
            layout="row"
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center"
            inputClassName="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-3.5 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            buttonClassName="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50"
          />
        </div>
      </section>

      <PromotionsFooter className="-mt-4 !mt-0 border-t-0" />
    </>
  );
}
