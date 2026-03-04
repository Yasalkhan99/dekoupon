"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Store } from "@/types/store";
import { slugify } from "@/lib/slugify";
import CouponRevealModal from "@/components/CouponRevealModal";

type Props = {
  storeInfo: Store;
  coupons: Store[];
  otherStores: Store[];
  codesCount: number;
  dealsCount: number;
  visitUrl: string;
  clickCounts: Record<string, number>;
};

const DEFAULT_FAQS = [
  { q: "What is a discount code?", a: "A discount code is a promo code you enter at checkout to get a percentage or fixed amount off your order." },
  { q: "How do I use a promo code?", a: "Copy the code from our page, go to the store website, add items to cart, and paste the code in the checkout or promo field." },
  { q: "Are these codes free to use?", a: "Yes. All codes and deals listed here are free for shoppers. We may earn a commission when you use our links, at no extra cost to you." },
];

const SHOPPING_TIPS = [
  "Check for limited-time offers and expiry dates before using a code.",
  "Sign up for the store's email newsletter to get exclusive codes.",
  "Try stacking a promo code with existing sales for maximum savings.",
  "Copy the code before clicking through—some codes are one-time use.",
];

/** Extract percentage from title (e.g. "10% Off" -> 10), else default */
function getPercentFromTitle(title: string, defaultPercent = 10): number {
  const match = title.match(/(\d+)\s*%\s*off/i) || title.match(/(\d+)\s*%/i);
  if (match) return Math.min(99, Math.max(1, parseInt(match[1], 10)));
  return defaultPercent;
}

/** True if coupon title looks like a shipping/delivery offer */
function isShippingCoupon(title: string): boolean {
  const t = (title || "").toLowerCase();
  return /\b(free\s*)?(delivery|shipping)\b/.test(t) || /\bdelivery\b/.test(t) || /\bshipping\b/.test(t);
}

/** Badge: badgeShipping (Free Shipping/Delivery) + badgeOffer (e.g. 20% OFF, $10 OFF); both can show in circle. Else legacy badgeLabel; else UK/US; else X% OFF. */
function getBadgeForCoupon(
  dealTitle: string,
  countryCodes: string | undefined,
  coupon: { badgeLabel?: string; badgeShipping?: string; badgeOffer?: string }
): { type: "percent"; percent: number } | { type: "text"; line1: string; line2?: string } {
  const shipping = (coupon.badgeShipping ?? "").trim();
  const offer = (coupon.badgeOffer ?? "").trim();
  const legacy = (coupon.badgeLabel ?? "").trim();

  const hasShipping = shipping !== "";
  const hasOffer = offer !== "";

  if (hasShipping || hasOffer) {
    const line1 = hasOffer ? offer : shipping;
    const line2 = hasShipping && hasOffer ? shipping : undefined;
    return { type: "text", line1, line2 };
  }

  if (legacy !== "") {
    const lower = legacy.toLowerCase();
    if (lower === "free_shipping") return { type: "text", line1: "Free Shipping" };
    if (lower === "free_delivery") return { type: "text", line1: "Free Delivery" };
    return { type: "text", line1: legacy };
  }

  const codes = (countryCodes ?? "").toUpperCase().replace(/\s/g, "");
  const isUK = /\b(GB|UK)\b/.test(codes) || codes === "GB" || codes === "UK";
  const isUS = /\bUS\b/.test(codes) || codes === "US";
  if (isUK) return { type: "text", line1: "Free Delivery" };
  if (isUS) return { type: "text", line1: "Free Shipping" };
  return { type: "percent", percent: getPercentFromTitle(dealTitle, 10) };
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Format expiry for display - deterministic UTC format to avoid hydration mismatch */
function formatExpiry(expiry: string | undefined): string {
  if (!expiry || !expiry.trim()) return "31 Dec, 2027";
  try {
    const d = new Date(expiry.trim());
    if (Number.isNaN(d.getTime())) return "31 Dec, 2027";
    const day = d.getUTCDate();
    const month = MONTHS_SHORT[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    return `${day} ${month}, ${year}`;
  } catch {
    return "31 Dec, 2027";
  }
}

export default function StorePageClient({
  storeInfo,
  coupons,
  otherStores,
  codesCount,
  dealsCount,
  visitUrl,
  clickCounts: initialClickCounts,
}: Props) {
  const [filter, setFilter] = useState<"all" | "code" | "deal">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sortBy, setSortBy] = useState<"ending" | "newest" | "used">("ending");
  const [extraClicks, setExtraClicks] = useState<Record<string, number>>({});
  const [revealingCoupon, setRevealingCoupon] = useState<{
    code: string;
    title: string;
    storeName: string;
    storeLogo: string;
    redirect: string;
    storeId: string;
    expiry?: string;
    isCode?: boolean;
    trending?: boolean;
  } | null>(null);

  // Open modal when URL has ?copy=<id> or ?shopnow=<id> (or legacy #o-<couponId>)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const copyId = params.get("copy");
    const shopnowId = params.get("shopnow");
    const couponId = copyId ?? shopnowId ?? (() => {
      const hash = window.location.hash || "";
      const m = hash.match(/^#o-(.+)$/);
      return m ? decodeURIComponent(m[1]) : null;
    })();
    if (!couponId) return;
    const coupon = coupons.find((c) => c.id === couponId);
    if (!coupon) return;
    const href = coupon.link || visitUrl;
    const isCode = coupon.couponType === "code";
    const dealTitle = (coupon.couponTitle ?? "").trim() || (isCode ? `Use code ${coupon.couponCode || ""}` : "Deal");
    setRevealingCoupon({
      code: coupon.couponCode || "",
      title: dealTitle,
      storeName: storeInfo.name,
      storeLogo: storeInfo.logoUrl || "",
      redirect: href,
      storeId: coupon.id,
      expiry: formatExpiry(coupon.expiry),
      isCode,
      trending: coupon.trending === true,
    });
  }, [coupons, visitUrl, storeInfo.name, storeInfo.logoUrl]);

  const filtered =
    filter === "all"
      ? coupons
      : filter === "code"
        ? coupons.filter((c) => c.couponType === "code")
        : coupons.filter((c) => c.couponType !== "code");

  const sorted = useMemo(() => {
    const list = [...filtered];
    const getExpiryTime = (c: Store) => {
      const e = c.expiry?.trim();
      if (!e) return Number.MAX_SAFE_INTEGER;
      const t = new Date(e).getTime();
      return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
    };
    const getClickCount = (c: Store) => (initialClickCounts[c.id] ?? 0) + (extraClicks[c.id] ?? 0);
    const getPriority = (c: Store) => c.priority ?? 999;
    if (sortBy === "ending") {
      list.sort((a, b) => {
        const ea = getExpiryTime(a);
        const eb = getExpiryTime(b);
        if (ea !== eb) return ea - eb;
        return getPriority(a) - getPriority(b);
      });
    } else if (sortBy === "newest") {
      list.sort((a, b) => {
        const cmp = (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
        if (cmp !== 0) return cmp;
        return getPriority(a) - getPriority(b);
      });
    } else {
      list.sort((a, b) => {
        const ua = getClickCount(a);
        const ub = getClickCount(b);
        if (ua !== ub) return ub - ua;
        return getPriority(a) - getPriority(b);
      });
    }
    return list;
  }, [filtered, sortBy, initialClickCounts, extraClicks]);

  const moreInfo = storeInfo.moreInfo?.trim();
  const displayName = (storeInfo.name ?? "").trim() || "Store";
  const sidebarCardName = (storeInfo.subStoreName ?? storeInfo.name ?? "").trim() || "Store";
  const shoppingTipsTitle = (storeInfo.shoppingTipsTitle ?? "").trim() || `${displayName} Coupon Code Shopping Tips`;
  const shoppingTipsList = Array.isArray(storeInfo.shoppingTips) && storeInfo.shoppingTips.length > 0
    ? storeInfo.shoppingTips.filter((t) => (t ?? "").trim() !== "")
    : SHOPPING_TIPS;
  const faqsToShow = Array.isArray(storeInfo.faqs) && storeInfo.faqs.length > 0
    ? storeInfo.faqs.filter((f) => (String(f?.q ?? "").trim() !== "" || String(f?.a ?? "").trim() !== ""))
    : DEFAULT_FAQS;

  const topCodes = coupons.filter((c) => c.couponType === "code").slice(0, 5);
  const newCodes = coupons.slice(0, 5);
  const locationLabel = storeInfo.countryCodes?.trim() || "Worldwide";

  const categoryLinks = [
    { label: `${displayName} Free Shipping Coupons`, href: "#" },
    { label: `${displayName} Student Discount`, href: "#" },
    { label: `${displayName} First Order Discount`, href: "#" },
  ];

  return (
    <>
      {revealingCoupon ? (
        <CouponRevealModal
          key={revealingCoupon.storeId}
          {...revealingCoupon}
          onClose={() => {
            // Do not remove copy/shopnow from URL – keep them so the param stays in the address bar
            setRevealingCoupon(null);
          }}
          blurBackdrop
        />
      ) : null}
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[18rem_1fr] lg:items-start lg:gap-x-10 lg:gap-y-0">
        {/* Part A: Coupons only – mobile par sabse upar; desktop par right column row 1 */}
        <div className="order-1 min-w-0 flex-1 lg:col-start-2 lg:row-start-1">
          {/* Store name + Discount Code heading, grid/list + sort */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl">
              {(storeInfo.storePageHeading ?? "").trim() || displayName}
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex rounded border border-zinc-200 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-zinc-500 hover:bg-zinc-100"}`}
                  aria-label="Grid view"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-blue-600 text-white" : "text-zinc-500 hover:bg-zinc-100"}`}
                  aria-label="List view"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                </button>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "ending" | "newest" | "used")}
                className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ending">Ending Soon</option>
                <option value="newest">Newest</option>
                <option value="used">Most Used</option>
              </select>
            </div>
          </div>

          <div role="region" aria-label="Coupon list">
            {sorted.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500 shadow-sm">
                No offers in this category.
              </div>
            ) : (
              <ul className={viewMode === "grid" ? "grid gap-5 sm:grid-cols-2 sm:gap-6" : "space-y-6"}>
                {sorted.map((c) => {
                const href = c.link || visitUrl;
                const isCode = c.couponType === "code";
                const param = isCode ? "copy" : "shopnow";
                const clickUrl = href.startsWith("http")
                  ? `/api/click?storeId=${encodeURIComponent(c.id)}&redirect=${encodeURIComponent(href)}`
                  : href;
                const dealTitle = (c.couponTitle ?? "").trim() || (isCode ? `Use code ${c.couponCode || ""}` : "Deal");
                const badge = getBadgeForCoupon(dealTitle, storeInfo.countryCodes, {
                  badgeLabel: c.badgeLabel,
                  badgeShipping: c.badgeShipping,
                  badgeOffer: c.badgeOffer,
                });
                const percent = badge.type === "percent" ? badge.percent : 10;
                const expiryDate = formatExpiry(c.expiry);
                const handleCouponClick = () => {
                  setExtraClicks((prev) => ({ ...prev, [c.id]: (prev[c.id] ?? 0) + 1 }));
                  const param = isCode ? "copy" : "shopnow";
                  const samePageUrl = typeof window !== "undefined" ? window.location.pathname + "?" + param + "=" + encodeURIComponent(c.id) : "";
                  window.open(samePageUrl || "?", "_blank", "noopener,noreferrer");
                  window.location.href = clickUrl;
                };
                const clickCount = (initialClickCounts[c.id] ?? 0) + (extraClicks[c.id] ?? 0);
                return (
                  <li
                    key={c.id}
                    id={`o-${encodeURIComponent(c.id)}`}
                    className={`flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-md ${viewMode === "grid" ? "items-stretch gap-5 p-6" : "sm:flex-row sm:items-center sm:gap-6 sm:p-6"}`}
                  >
                    <div className="flex shrink-0 items-center justify-center">
                      <div className="flex h-24 w-24 flex-shrink-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-full bg-gradient-to-br from-amber-400 to-orange-500 px-1.5 py-1 text-center text-white shadow-inner sm:h-28 sm:w-28">
                        {badge.type === "text" ? (
                          <>
                            <span className="break-words text-center text-xs font-bold leading-tight sm:text-sm">{badge.line1}</span>
                            {badge.line2 ? (
                              <span className="break-words text-center text-[7px] font-semibold leading-tight opacity-95 sm:text-[8px]">{badge.line2}</span>
                            ) : null}
                            <span className="break-words text-center text-[6px] font-medium leading-tight uppercase tracking-wide opacity-90 sm:text-[7px]">Savingshub4u</span>
                          </>
                        ) : (
                          <>
                            <span className="text-lg font-bold leading-tight sm:text-xl">{percent}%</span>
                            <span className="text-[10px] font-semibold uppercase leading-tight opacity-95 sm:text-xs">OFF</span>
                            <span className="mt-0.5 text-[7px] font-medium uppercase leading-tight tracking-wide opacity-90 sm:text-[8px]">Savingshub4u</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={`flex min-w-0 flex-1 flex-col items-start text-left p-5 pt-0 ${viewMode === "list" ? "sm:flex-row sm:items-center sm:justify-between sm:pt-5" : "sm:pt-0"}`}>
                      <div className="min-w-0 w-full flex-1 space-y-2">
                        {c.trending === true && (
                          <span className="mb-1 inline-block rounded bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">Exclusive</span>
                        )}
                        <p className="flex items-center gap-1.5 text-left text-xs text-zinc-500">
                          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {expiryDate}
                        </p>
                        <button
                          type="button"
                          onClick={handleCouponClick}
                          className="w-full break-words text-left font-bold text-zinc-900 transition hover:text-blue-600 cursor-pointer whitespace-normal"
                        >
                          {dealTitle && dealTitle !== "Deal" ? dealTitle : `${percent}% Off All Products - Limited Stock`}
                        </button>
                        <p className="flex items-center gap-1 text-left text-xs text-zinc-500" title="Clicks">
                          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122m2.122-10.606l2.12 2.122M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {clickCount} click{clickCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="mt-5 flex w-full flex-shrink-0 items-center justify-start gap-3 sm:mt-0 sm:w-auto">
                        <button
                          type="button"
                          onClick={handleCouponClick}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          {isCode ? "GET CODE" : "GET DEAL"}
                        </button>
                        <span className="flex items-center gap-1 text-xs text-zinc-500" title="Comments">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          0
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
              </ul>
            )}
          </div>
          </div>
          {/* End Part A: coupons */}

        {/* Sidebar column: mobile par coupons ke baad, More About se pehle; desktop par left column */}
        <div className="order-2 flex flex-col gap-6 lg:order-1 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <div className="shrink-0">
            <div className="sticky top-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-28 w-full max-w-[200px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-100 bg-white p-4 shadow-md ring-1 ring-zinc-200/60 sm:h-32 sm:max-w-[240px] sm:p-5">
                  {storeInfo.logoUrl ? (
                    <div className="relative h-full w-full min-h-[80px] bg-white">
                      <Image src={storeInfo.logoUrl} alt={storeInfo.logoAltText || storeInfo.name} fill className="object-contain" sizes="(max-width: 640px) 200px, 240px" unoptimized />
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-zinc-700">{sidebarCardName.slice(0, 4).toUpperCase()}</span>
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold text-zinc-900">{sidebarCardName}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {locationLabel}
                </p>
              </div>
            </div>
          </div>

          <aside className="hidden shrink-0 space-y-6 lg:block lg:w-full">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-800">About Store</h2>
              <p className="text-sm leading-relaxed text-zinc-600">
                {storeInfo.description || `${displayName} offers verified coupon codes and deals. Save with hand-tested offers.`}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-zinc-900">
                {displayName} Codes and Coupons
              </h3>
              {storeInfo.codesAndCouponsContent?.trim() ? (
                <div
                  className="mt-3 text-sm leading-relaxed text-zinc-600 prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0"
                  dangerouslySetInnerHTML={{ __html: storeInfo.codesAndCouponsContent.trim() }}
                />
              ) : null}
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-800">
                {displayName} coupon and promo codes FAQ
              </h3>
              <div className="space-y-2">
                {faqsToShow.map((faq, i) => (
                  <details
                    key={i}
                    className="group rounded-lg border border-zinc-100 bg-zinc-50/50"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-zinc-900 [&::-webkit-details-marker]:hidden">
                      {faq.q}
                      <span className="shrink-0 text-zinc-400 transition group-open:rotate-180">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </span>
                    </summary>
                    <p className="border-t border-zinc-100 px-3 py-2 text-xs text-zinc-600">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Part B: More About + Shopping Tips + Terms – mobile par logo ke baad; desktop par right column row 2 */}
        <div className="order-3 min-w-0 lg:col-start-2 lg:row-start-2">
          {/* More About [store name] – below coupons, admin-editable */}
          <section className="mt-10 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-zinc-900">
              More About {displayName}
            </h2>
            {storeInfo.moreAboutContent?.trim() ? (
              <div
                className="prose prose-zinc max-w-none text-sm text-zinc-600 prose-p:my-2 prose-ul:my-2 prose-ol:my-2"
                dangerouslySetInnerHTML={{ __html: storeInfo.moreAboutContent.trim() }}
              />
            ) : (
              <p className="text-sm text-zinc-500">Add content from Admin → Stores → Edit this store → &quot;More About [store name]&quot;.</p>
            )}
          </section>

          {/* Shopping Tips */}
          <section className="mt-10 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-zinc-900">
              {shoppingTipsTitle}
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-600">
              {shoppingTipsList.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </section>

          {/* Terms */}
          {moreInfo && (
            <section className="mt-10 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-zinc-900">
                Terms Of {displayName}
              </h2>
              <div
                className="prose prose-zinc max-w-none text-sm text-zinc-600"
                dangerouslySetInnerHTML={{ __html: moreInfo }}
              />
            </section>
          )}
        </div>

        {/* Mobile only: About Store, Codes and Coupons, FAQ – Part B ke baad */}
        <aside className="order-4 shrink-0 space-y-6 lg:hidden lg:w-72">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-800">About Store</h2>
              <p className="text-sm leading-relaxed text-zinc-600">
                {storeInfo.description || `${displayName} offers verified coupon codes and deals. Save with hand-tested offers.`}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-zinc-900">
                {displayName} Codes and Coupons
              </h3>
              {storeInfo.codesAndCouponsContent?.trim() ? (
                <div
                  className="mt-3 text-sm leading-relaxed text-zinc-600 prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0"
                  dangerouslySetInnerHTML={{ __html: storeInfo.codesAndCouponsContent.trim() }}
                />
              ) : null}
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-800">
                {displayName} coupon and promo codes FAQ
              </h3>
              <div className="space-y-2">
                {faqsToShow.map((faq, i) => (
                  <details
                    key={i}
                    className="group rounded-lg border border-zinc-100 bg-zinc-50/50"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-zinc-900 [&::-webkit-details-marker]:hidden">
                      {faq.q}
                      <span className="shrink-0 text-zinc-400 transition group-open:rotate-180">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </span>
                    </summary>
                    <p className="border-t border-zinc-100 px-3 py-2 text-xs text-zinc-600">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
        </aside>
      </div>
    </>
  );
}
