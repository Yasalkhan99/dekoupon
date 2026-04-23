import type { Metadata } from "next";
import Link from "next/link";
import CategoriesSidebar from "@/components/CategoriesSidebar";
import CategoryIcon from "@/components/CategoryIcon";
import PromotionsFooter from "@/components/PromotionsFooter";
import { STORE_CATEGORIES } from "@/data/categories";
import { getStores, getStoreCategories } from "@/lib/stores";
import { canonicalUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Best Coupons, Promo Codes & Online Deals | SavingsHub4U" },
  description:
    "Save more with SavingsHub4U! Discover verified coupons, promo codes, and exclusive deals on hotels, flights, clothing, food delivery, tech, and more.",
  alternates: { canonical: canonicalUrl("/promotions/categories") },
};

export default async function CategoriesPage() {
  const stores = await getStores();
  const enabled = stores.filter((s) => s.status !== "disable");
  const categoryCounts = enabled.reduce<Record<string, number>>((acc, s) => {
    for (const cat of getStoreCategories(s)) {
      if (cat) acc[cat] = (acc[cat] ?? 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="flex min-h-0 flex-1 flex-col" suppressHydrationWarning>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <nav className="mb-6 text-sm text-zinc-500" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-zinc-700">
                SavingsHub4u
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <Link href="/promotions" className="hover:text-zinc-700">
                Promotions
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li className="font-medium text-zinc-900">Categories</li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
          <div className="min-w-0 lg:col-span-8 xl:col-span-9">
            {/* Couponly-style: heading on light section */}
            <section className="mb-8 rounded-xl border border-emerald-900/10 bg-[var(--card-bg)] px-6 py-8 shadow-sm sm:px-8">
              <h1 className="text-center text-3xl font-bold tracking-tight text-zinc-900">
                Categories
              </h1>
            </section>

            {/* 3-column grid of category cards */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {STORE_CATEGORIES.map(({ name, slug: catSlug }) => (
                <Link
                  key={catSlug}
                  href={`/promotions/category/${catSlug}`}
                  className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md"
                >
                  <CategoryIcon
                    categoryName={name}
                    className="mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700"
                  />
                  <span className="text-center font-medium text-zinc-900">{name}</span>
                  {categoryCounts[name] !== undefined && (
                    <span className="mt-1 text-sm text-zinc-500">
                      {categoryCounts[name]} {categoryCounts[name] === 1 ? "brand" : "brands"}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
          <div className="lg:col-span-4 xl:col-span-3">
            <CategoriesSidebar />
          </div>
        </div>
      </main>

      <PromotionsFooter />
    </div>
  );
}
