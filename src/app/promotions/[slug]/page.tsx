import { notFound } from "next/navigation";
import Link from "next/link";
import PromotionsFooter from "@/components/PromotionsFooter";
import PromotionsHeader from "@/components/PromotionsHeader";
import { getClickCounts } from "@/lib/clicks";
import { getStorePageData } from "@/lib/stores";
import type { Store } from "@/types/store";
import StorePageClient from "@/components/StorePageClient";

type Props = { params: Promise<{ slug: string }> };

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const [{ storeInfo, coupons, otherStores }, clickCounts] = await Promise.all([
    getStorePageData(slug),
    getClickCounts(),
  ]);
  if (!storeInfo) notFound();

  const codesCount = coupons.filter((c) => c.couponType === "code").length;
  const dealsCount = coupons.filter((c) => c.couponType !== "code").length;
  const visitUrl = storeInfo.trackingUrl || storeInfo.link || storeInfo.websiteUrl || "#";
  const displayName = (storeInfo.name ?? "").trim() || "Store";
  const categoryLabel = (storeInfo.category ?? "").trim() || "Category";

  const siteName = "SavingsHub4u";

  return (
    <div className="min-h-screen bg-white text-zinc-900" suppressHydrationWarning>
      <PromotionsHeader />
      {/* Breadcrumb strip - light peach/orange, centered Store title, current in blue */}
      <div className="border-b border-amber-200/60 bg-[#fff8f0]">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{displayName}</h1>
          <nav className="mt-2 text-sm text-zinc-600" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center justify-center gap-1">
              <li>
                <Link href="/" className="hover:text-zinc-900">{siteName}</Link>
              </li>
              <li aria-hidden>›</li>
              <li>
                <Link href="/promotions" className="hover:text-zinc-900">{categoryLabel}</Link>
              </li>
              <li aria-hidden>›</li>
              <li>
                <span className="font-medium text-blue-600">{displayName}</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <StorePageClient
          storeInfo={storeInfo}
          coupons={coupons}
          otherStores={otherStores}
          codesCount={codesCount}
          dealsCount={dealsCount}
          visitUrl={visitUrl}
          clickCounts={clickCounts}
        />
      </main>

      {/* Newsletter - blue banner 70% width (15% margin each side), left/right SVGs */}
      <section className="relative mx-[15%] overflow-hidden rounded-2xl bg-blue-600 py-10">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-12 opacity-30 sm:px-20">
          <img src="/Group%201171275124.svg" alt="" className="h-24 w-24 shrink-0 object-contain sm:h-32 sm:w-32" />
          <img src="/Group%201171275125.svg" alt="" className="h-24 w-24 shrink-0 object-contain sm:h-32 sm:w-32" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-white sm:text-2xl">Join our newsletter for updates!</h2>
          <p className="mt-2 text-sm text-blue-100">Join our community with more than 300K active users</p>
          <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <input
              type="email"
              placeholder="Email Address"
              className="w-full max-w-xs rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-900 shadow-sm placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 sm:max-w-sm"
            />
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-3 font-semibold text-white transition hover:bg-amber-600"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Footer - same as promotions: black bg, white text, blue hover, no gap below newsletter */}
      <PromotionsFooter className="-mt-4 !mt-0 border-t-0" />
    </div>
  );
}
