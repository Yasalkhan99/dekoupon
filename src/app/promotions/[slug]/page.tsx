import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import PromotionsFooter from "@/components/PromotionsFooter";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import { getClickCounts } from "@/lib/clicks";
import { getStorePageData, getStoreCategories } from "@/lib/stores";
import type { Store } from "@/types/store";
import StorePageClient from "@/components/StorePageClient";
import { canonicalUrl } from "@/lib/site";

function replaceSeoPlaceholders(
  text: string,
  store: Store,
  couponsCount: number,
  highestOffer?: string
): string {
  const monthYear = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return text
    .replace(/\{store_name\}/gi, (store.name ?? "").trim() || "Store")
    .replace(/\{month_year\}/gi, monthYear)
    .replace(/\{active_coupons\}/gi, String(couponsCount))
    .replace(/\{highest_offer\}/gi, highestOffer ?? "");
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { storeInfo, coupons } = await getStorePageData(slug);
  if (!storeInfo) return {};
  const couponsCount = coupons.filter((c) => c.status !== "disable").length;
  const highestOffer = coupons
    .map((c) => c.badgeOffer ?? c.badgeLabel ?? "")
    .filter(Boolean)[0];
  const titleRaw = (storeInfo.seoTitle ?? "").trim();
  const descRaw = (storeInfo.seoMetaDesc ?? "").trim();
  const title = titleRaw
    ? replaceSeoPlaceholders(titleRaw, storeInfo, couponsCount, highestOffer)
    : `${storeInfo.name ?? "Store"} Coupons & Promo Codes | SavingsHub4U`;
  const description = descRaw
    ? replaceSeoPlaceholders(descRaw, storeInfo, couponsCount, highestOffer)
    : `Save with ${storeInfo.name ?? "Store"} coupons and promo codes. Verified discounts updated regularly.`;
  return {
    title: { absolute: title.slice(0, 100) },
    description: description.slice(0, 160),
    alternates: { canonical: canonicalUrl(`/promotions/${encodeURIComponent(slug)}`) },
  };
}

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
  const cats = getStoreCategories(storeInfo);
  const categoryLabel = cats[0] ?? "Category";

  const siteName = "SavingsHub4u";

  return (
    <div className="flex min-h-0 flex-1 flex-col" suppressHydrationWarning>
      {/* DOM: main first (a11y). Mobile: flex order shows coupons above beige strip; md+: breadcrumb on top */}
      <div className="flex flex-col">
        <main className="order-1 mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-2 sm:px-6 sm:pb-10 sm:pt-6 md:order-2 md:py-10 lg:px-8">
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

        <div className="order-2 border-b border-t border-emerald-200/50 bg-gradient-to-b from-emerald-50/60 to-[var(--card-bg)] md:order-1 md:border-t-0">
          <div className="mx-auto max-w-7xl px-4 py-2.5 text-center sm:px-6 sm:py-5 md:py-6 lg:px-8">
            <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl md:text-3xl">{displayName}</h1>
            <nav className="mt-1 text-sm text-zinc-600 md:mt-2" aria-label="Breadcrumb">
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
                  <span className="font-medium text-[var(--footer-accent)]">{displayName}</span>
                </li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      {/* Newsletter - blue banner 70% width (15% margin each side), left/right SVGs */}
      <section className="relative mx-[15%] overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-800 py-10 shadow-lg">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-12 opacity-30 sm:px-20">
          <img src="/Group%201171275124.svg" alt="" className="h-24 w-24 shrink-0 object-contain sm:h-32 sm:w-32" />
          <img src="/Group%201171275125.svg" alt="" className="h-24 w-24 shrink-0 object-contain sm:h-32 sm:w-32" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-white sm:text-2xl">Join our newsletter for updates!</h2>
          <p className="mt-2 text-sm text-emerald-100">Join our community with more than 300K active users</p>
          <NewsletterSubscribe
            placeholder="Email Address"
            buttonText="Subscribe"
            layout="row"
            className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center"
            inputClassName="w-full max-w-xs rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-900 shadow-sm placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 sm:max-w-sm"
            buttonClassName="flex items-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50"
          />
        </div>
      </section>

      {/* Footer - same as promotions: black bg, white text, blue hover, no gap below newsletter */}
      <PromotionsFooter className="-mt-4 !mt-0 border-t-0" />
    </div>
  );
}
