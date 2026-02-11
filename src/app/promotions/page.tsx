import Link from "next/link";
import Image from "next/image";
import PromotionsFooter from "@/components/PromotionsFooter";
import PromotionsHeader from "@/components/PromotionsHeader";
import PromotionsHeroSearch from "@/components/PromotionsHeroSearch";
import CategoryIcon from "@/components/CategoryIcon";
import Pagination from "@/components/Pagination";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import { getStores, getCoupons, slugify, canonicalSlug, hasCouponData, slugMatches } from "@/lib/stores";
import { getBlogData } from "@/lib/blog";
import { stripHtml } from "@/lib/slugify";
import { STORE_CATEGORIES } from "@/data/categories";
import { getBlogImageAspectClass, type ImageAspectRatio } from "@/data/blog";
import type { Store } from "@/types/store";

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
  const { page: pageStr, q: searchQuery } = await searchParams;
  const currentPage = Math.max(1, parseInt(String(pageStr || "1"), 10) || 1);
  const [allRows, allCouponsFromTable] = await Promise.all([getStores(), getCoupons()]);
  const enabled = allRows.filter((s) => s.status !== "disable");
  const { uniqueStores, getCouponCount: getCouponCountFromStores } = buildUniqueStoresAndCouponCounts(enabled);
  const searchFilteredStores = filterStoresByQuery(uniqueStores, searchQuery ?? "");

  const enabledCoupons = allCouponsFromTable.filter((c) => c.status !== "disable");
  const couponCountByKey = new Map<string, number>();
  for (const store of uniqueStores) {
    const wantRaw = (store.slug || slugify(store.name)).toLowerCase().trim() || (store.name ?? "").toLowerCase().trim();
    if (!wantRaw) continue;
    const key = canonicalSlug(wantRaw);
    const count = enabledCoupons.filter((c) => slugMatches(c, wantRaw, key)).length;
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
  const { featuredPosts } = await getBlogData();

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <PromotionsHeader />

      {/* Hero - peach background, two banner images (no Total Categories / AVG Reviews). overflow-visible so search dropdown is not clipped. */}
      <section className="relative overflow-visible bg-amber-50/95 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <div className="flex-1 overflow-visible">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Discover The Best Affiliate <span className="text-blue-600">Coupons</span>
              </h1>
              <p className="mt-3 max-w-xl text-base text-zinc-600">
                Save big on your favorite brands with our exclusive coupons, discount codes, and deals.
              </p>
              <div className="mt-6 max-w-2xl">
                <PromotionsHeroSearch initialQuery={searchQuery ?? ""} />
              </div>
            </div>
            <div className="flex flex-1 items-end justify-center gap-4 lg:justify-end">
              <div className="relative h-64 w-44 shrink-0 overflow-hidden rounded-2xl shadow-lg sm:h-72 sm:w-52">
                <Image
                  src="/banner-index-1.webp"
                  alt="Save with coupons and deals"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 176px, 208px"
                  priority
                />
              </div>
              <div className="relative h-80 w-56 shrink-0 overflow-hidden rounded-2xl shadow-lg sm:h-96 sm:w-64">
                <Image
                  src="/banner-index-2.webp"
                  alt="Best affiliate coupons and discounts"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 224px, 256px"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* When search is active: show results right below hero so stores are visible immediately */}
        {searchQuery?.trim() && (
          <section id="search-results" className="mb-14 scroll-mt-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                Search results for &quot;{searchQuery.trim()}&quot;
              </h2>
            </div>
            {searchFilteredStores.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-amber-50/80 py-16 text-center">
                <p className="mb-2 text-zinc-700">No stores found for &quot;{searchQuery.trim()}&quot;.</p>
                <p className="mb-4 text-sm text-zinc-600">Try a different search or clear the search to see all stores.</p>
                <Link href="/promotions" className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Show all stores</Link>
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
                    >
                      {store.logoUrl ? (
                        <div className="relative mb-4 h-16 w-full">
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
                      <div className="mb-3 text-xs text-zinc-500">Expiry: {store.expiry}</div>
                      <Link
                        href={`/promotions/${store.slug || slugify(store.name)}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
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

        {/* Popular Coupons */}
        <section className="mb-14">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              Popular Coupons
            </h2>
            <Link
              href="/promotions"
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              View More →
            </Link>
          </div>
          {popularCouponsStores.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 py-12 text-center">
              <p className="text-sm text-zinc-500">No coupons yet. Add stores and coupons from the admin.</p>
              <Link href="/admin" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">Go to Admin</Link>
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
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      <span>Expires: {store.expiry}</span>
                      <span>{count} Coupon{count !== 1 ? "s" : ""}</span>
                    </div>
                    <Link
                      href={`/promotions/${storeSlug}`}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
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
              className="text-sm font-semibold text-blue-600 hover:underline"
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
                  className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
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
        <section className="mb-14 rounded-2xl bg-amber-50/80 px-6 py-10 sm:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              Trending Categories
            </h2>
            <Link
              href="/promotions/categories"
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              View More →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {trendingCategories.map(({ name, slug: catSlug }) => (
              <Link
                key={catSlug}
                href={`/promotions/category/${catSlug}`}
                className="flex items-center gap-4 rounded-xl border border-amber-100 bg-white p-4 transition hover:border-amber-200 hover:shadow-sm"
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
        <section className="mb-14 rounded-2xl bg-[#e0f2f7] px-6 py-12 sm:px-8 lg:px-12">
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
        <section className="mb-14 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-10 text-white sm:px-10">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Join our newsletter for updates!
              </h2>
              <p className="mt-2 text-sm text-blue-100">
                Get the best deals and coupon codes delivered to your inbox.
              </p>
            </div>
            <NewsletterSubscribe
              placeholder="Enter your email address"
              buttonText="Subscribe"
              layout="row"
              className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-center"
              inputClassName="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              buttonClassName="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-zinc-900 transition hover:bg-amber-400"
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
              <Link href="/admin" className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Go to Admin</Link>
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
                  >
                    {store.logoUrl ? (
                      <div className="relative mb-4 h-16 w-full">
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
                    <div className="mb-3 text-xs text-zinc-500">Expiry: {store.expiry}</div>
                    <Link
                      href={`/promotions/${store.slug || slugify(store.name)}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-md transition hover:shadow-lg"
              >
                <div className={`relative w-full overflow-hidden bg-zinc-100 ${getBlogImageAspectClass((post as { imageAspectRatio?: ImageAspectRatio }).imageAspectRatio)}`}>
                  <Image
                    src={post.image}
                    alt={stripHtml(post.title)}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-600">{post.category}</span>
                  <h3 className="mb-2 line-clamp-2 text-base font-bold text-zinc-900 group-hover:text-blue-600 [&_a]:text-red-600 [&_a]:underline" dangerouslySetInnerHTML={{ __html: post.title }} />
                  <div className="blog-content mb-3 flex-1 line-clamp-2 text-sm text-zinc-600" dangerouslySetInnerHTML={{ __html: post.excerpt }} />
                  <span className="text-sm font-medium text-blue-600 group-hover:underline">Read More →</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/" className="inline-flex text-sm font-medium text-blue-600 hover:underline">
              View all articles →
            </Link>
          </div>
        </section>
      </main>

      {/* Newsletter - 70% width (15% margin each side), no bottom gap */}
      <section className="relative mx-[15%] overflow-hidden rounded-2xl bg-blue-600 px-4 py-14 sm:px-6 lg:px-8">
        <div className="absolute left-4 top-1/2 hidden h-32 w-32 -translate-y-1/2 opacity-30 lg:block" aria-hidden>
          <Image src="/Group 1171275124.svg" alt="" width={128} height={128} className="h-full w-full object-contain" unoptimized />
        </div>
        <div className="absolute right-4 top-1/2 hidden h-32 w-32 -translate-y-1/2 opacity-30 lg:block" aria-hidden>
          <Image src="/Group 1171275125.svg" alt="" width={128} height={128} className="h-full w-full object-contain" unoptimized />
        </div>
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Join our newsletter for updates!
          </h2>
          <p className="mt-2 text-sm text-blue-100">
            Join our community with more than 300K active users
          </p>
          <NewsletterSubscribe
            placeholder="Email Address"
            buttonText="Subscribe"
            layout="row"
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center"
            inputClassName="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-3.5 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            buttonClassName="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-3.5 font-semibold text-white transition hover:bg-orange-400"
          />
        </div>
      </section>

      <PromotionsFooter className="-mt-4 !mt-0 border-t-0" />
    </div>
  );
}
