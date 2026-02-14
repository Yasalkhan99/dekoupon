import type { Metadata } from "next";
import Link from "next/link";
import PromotionsFooter from "@/components/PromotionsFooter";
import PromotionsHeader from "@/components/PromotionsHeader";
import ShareCouponForm from "@/components/ShareCouponForm";
import { getStores, getStoreCategories } from "@/lib/stores";

export const metadata: Metadata = {
  title: { absolute: "Share a Coupon & Submit Promo Codes | SavingsHub4U" },
  description:
    "Submit and share the latest coupons, promo codes, and deals on SavingsHub4U. Help others save money by adding verified discounts and exclusive offers today.",
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
    <div className="min-h-screen bg-white text-zinc-900">
      <PromotionsHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
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
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Left sidebar - Categories (from backend stores only) */}
          <aside className="w-full shrink-0 rounded-lg border border-zinc-200 bg-zinc-50/50 p-5 lg:w-64">
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
                      className="block text-sm text-zinc-600 hover:text-blue-600 hover:underline"
                    >
                      {name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {/* Right - Share A Coupon form */}
          <div className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm lg:p-8">
            <h1 className="mb-2 text-2xl font-bold text-zinc-900">Share A Coupon</h1>
            <ShareCouponForm />
          </div>
        </div>
      </main>

      <PromotionsFooter />
    </div>
  );
}
