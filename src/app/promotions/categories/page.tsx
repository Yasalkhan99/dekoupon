import type { Metadata } from "next";
import Link from "next/link";
import CategoriesSidebar from "@/components/CategoriesSidebar";
import CategoryIcon from "@/components/CategoryIcon";
import PromotionsFooter from "@/components/PromotionsFooter";
import PromotionsHeader from "@/components/PromotionsHeader";
import { STORE_CATEGORIES } from "@/data/categories";
import { getStores, getStoreCategories } from "@/lib/stores";

export const metadata: Metadata = {
  title: { absolute: "Best Coupons, Promo Codes & Online Deals | SavingsHub4U" },
  description:
    "Save more with SavingsHub4U! Discover verified coupons, promo codes, and exclusive deals on hotels, flights, clothing, food delivery, tech, and more.",
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
    <div className="min-h-screen bg-white text-zinc-900" suppressHydrationWarning>
      <PromotionsHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
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

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            {/* Couponly-style: heading on light section */}
            <section className="mb-8 rounded-xl bg-amber-50/80 px-6 py-8 sm:px-8">
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
          <CategoriesSidebar />
        </div>
      </main>

      <PromotionsFooter />
    </div>
  );
}
