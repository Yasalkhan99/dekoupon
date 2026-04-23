import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import PromotionsFooter from "@/components/PromotionsFooter";
import { getStores, slugify } from "@/lib/stores";
import BrandsAlphabetBar from "./BrandsAlphabetBar";
import { canonicalUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Top Brands Coupons & Promo Codes | SavingsHub4U" },
  description:
    "Browse verified coupons and promo codes from top brands at SavingsHub4U. Find the latest deals, exclusive discounts, and special offers on fashion, travel, tech, food delivery, and more, all updated daily to help you save more.",
  alternates: { canonical: canonicalUrl("/promotions/brands") },
};

function filterStoresByLetter(stores: Awaited<ReturnType<typeof getStores>>, letter: string | null) {
  if (!letter) return stores;
  const upper = letter.toUpperCase();
  if (upper === "0-9") {
    return stores.filter((s) => /^[0-9]/.test((s.name || "").trim()));
  }
  return stores.filter((s) => {
    const first = (s.name || "").trim().toUpperCase().slice(0, 1);
    return first === upper || (upper === "0-9" && /^[0-9]/.test(first));
  });
}

type Props = { searchParams: Promise<{ letter?: string }> };

export default async function BrandsPage({ searchParams }: Props) {
  const { letter: letterParam } = await searchParams;
  const letter = letterParam && letterParam.length > 0 ? letterParam : null;
  const normalizedLetter = letter === "0-9" ? "0-9" : letter?.toUpperCase().slice(0, 1) || null;

  const allStores = await getStores();
  const sorted = [...allStores].sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
  const stores = filterStoresByLetter(sorted, normalizedLetter);

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
              <Link href="/promotions" className="hover:text-zinc-700">Promotions</Link>
            </li>
            <li aria-hidden>›</li>
            <li className="font-medium text-zinc-900">Brands</li>
          </ol>
        </nav>

        <h1 className="mb-2 text-2xl font-bold uppercase tracking-wide text-zinc-900">
          All Brands
        </h1>
        <p className="mb-4 text-sm text-zinc-500">
          {stores.length} stores listed
          {normalizedLetter && (
            <span> (starting with {normalizedLetter})</span>
          )}
        </p>

        <BrandsAlphabetBar activeLetter={normalizedLetter} />

        <div className="mt-6">
        {stores.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50 py-16 text-center">
            <p className="mb-2 text-zinc-600">
              No stores yet. Add coupons and deals from the admin panel.
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center rounded-md bg-[var(--footer-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--footer-accent-hover)]"
            >
              Go to Admin
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stores.map((store) => (
              <article
                key={store.id}
                className="flex flex-col overflow-hidden rounded-lg border border-zinc-100 bg-white p-5 shadow-md transition hover:shadow-lg"
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
                  <h3 className="mb-4 text-lg font-bold text-zinc-900">
                    {store.name}
                  </h3>
                )}
                <p className="mb-4 flex-1 text-sm font-medium text-zinc-900 line-clamp-2">
                  {store.name}
                </p>
                <div className="mb-3 text-xs text-zinc-500">
                  Expiry: {store.expiry}
                </div>
                <Link
                  href={`/promotions/${store.slug || slugify(store.name)}`}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--footer-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--footer-accent-hover)]"
                >
                  Get Coupon
                </Link>
              </article>
            ))}
          </div>
        )}
        </div>
      </main>

      <PromotionsFooter />
    </div>
  );
}
