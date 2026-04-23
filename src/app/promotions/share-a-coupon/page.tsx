import type { Metadata } from "next";
import Link from "next/link";
import PromotionsFooter from "@/components/PromotionsFooter";
import ShareCouponForm from "@/components/ShareCouponForm";
import { getStores, getStoreCategories } from "@/lib/stores";
import { canonicalUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Share a Coupon & Submit Promo Codes | SavingsHub4U" },
  description:
    "Submit and share the latest coupons, promo codes, and deals on SavingsHub4U. Help others save money by adding verified discounts and exclusive offers today.",
  alternates: { canonical: canonicalUrl("/promotions/share-a-coupon") },
};

function slug(str: string) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default async function ShareACouponPage() {
  const stores = await getStores();
  const categoriesFromBackend = [...new Set(stores.flatMap((s) => getStoreCategories(s)))].sort(
    (a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  return (
    <>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        {/* Breadcrumbs */}
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
            <li className="text-zinc-900 font-medium">Share A Coupon</li>
          </ol>
        </nav>

        {/* Two columns: sidebar + form */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
          {/* Left sidebar - Categories (from backend stores only) */}
          <aside className="w-full rounded-xl border border-emerald-900/10 bg-[var(--card-bg)] p-5 shadow-sm lg:col-span-4 xl:col-span-3">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-zinc-700">
              Categories
            </h2>
            {categoriesFromBackend.length === 0 ? (
              <p className="text-sm text-zinc-500">No categories yet. Categories appear when stores have a category set in the admin.</p>
            ) : (
              <ul className="space-y-2">
                {categoriesFromBackend.map((name) => (
                  <li key={name}>
                    <Link
                      href={`/promotions/category/${slug(name)}`}
                      className="block text-sm text-zinc-600 hover:text-[var(--footer-accent)] hover:underline"
                    >
                      {name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {/* Right - Share A Coupon form */}
          <div className="min-w-0 rounded-xl border border-emerald-900/10 bg-white p-6 shadow-md lg:col-span-8 lg:p-8 xl:col-span-9">
            <h1 className="mb-2 text-2xl font-bold text-zinc-900">Share A Coupon</h1>
            <ShareCouponForm />
          </div>
        </div>
      </main>

      <PromotionsFooter />
    </>
  );
}
