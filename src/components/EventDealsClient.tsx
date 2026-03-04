"use client";

import { useState, useMemo, useEffect } from "react";
import type { Store } from "@/types/store";
import CouponRevealModal from "@/components/CouponRevealModal";

function getPercentFromTitle(title: string, defaultPercent = 10): number {
  const match = title.match(/(\d+)\s*%\s*off/i) || title.match(/(\d+)\s*%/i);
  if (match) return Math.min(99, Math.max(1, parseInt(match[1], 10)));
  return defaultPercent;
}

function getBadgeForCoupon(
  dealTitle: string,
  countryCodes: string | undefined,
  coupon: { badgeLabel?: string; badgeShipping?: string; badgeOffer?: string }
): { type: "percent"; percent: number } | { type: "text"; line1: string; line2?: string } {
  const shipping = (coupon.badgeShipping ?? "").trim();
  const offer = (coupon.badgeOffer ?? "").trim();
  const legacy = (coupon.badgeLabel ?? "").trim();
  if (shipping !== "" || offer !== "") {
    const line1 = offer || shipping;
    const line2 = shipping && offer ? shipping : undefined;
    return { type: "text", line1, line2 };
  }
  if (legacy !== "") {
    const lower = legacy.toLowerCase();
    if (lower === "free_shipping") return { type: "text", line1: "Free Shipping" };
    if (lower === "free_delivery") return { type: "text", line1: "Free Delivery" };
    return { type: "text", line1: legacy };
  }
  const codes = (countryCodes ?? "").toUpperCase().replace(/\s/g, "");
  if (/\b(GB|UK)\b/.test(codes) || codes === "GB" || codes === "UK") return { type: "text", line1: "Free Delivery" };
  if (/\bUS\b/.test(codes) || codes === "US") return { type: "text", line1: "Free Shipping" };
  return { type: "percent", percent: getPercentFromTitle(dealTitle, 10) };
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatExpiry(expiry: string | undefined): string {
  if (!expiry?.trim()) return "31 Dec, 2027";
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

type Props = {
  eventName: string;
  eventDescription?: string;
  coupons: Store[];
  clickCounts: Record<string, number>;
};

export default function EventDealsClient({ eventName, eventDescription, coupons, clickCounts }: Props) {
  const [sortBy, setSortBy] = useState<"ending" | "newest" | "used">("ending");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
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
    const c = coupons.find((x) => x.id === couponId);
    if (!c) return;
    const href = c.link || c.trackingUrl || "#";
    const isCode = c.couponType === "code";
    const dealTitle = (c.couponTitle ?? "").trim() || (isCode ? `Use code ${c.couponCode || ""}` : "Deal");
    setRevealingCoupon({
      code: c.couponCode || "",
      title: dealTitle,
      storeName: c.name || "Store",
      storeLogo: c.logoUrl || "",
      redirect: href,
      storeId: c.id,
      expiry: formatExpiry(c.expiry),
      isCode,
      trending: c.trending === true,
    });
  }, [coupons]);

  const sorted = useMemo(() => {
    const list = [...coupons];
    const getExpiryTime = (c: Store) => {
      const e = c.expiry?.trim();
      if (!e) return Number.MAX_SAFE_INTEGER;
      const t = new Date(e).getTime();
      return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
    };
    const getClickCount = (c: Store) => (clickCounts[c.id] ?? 0) + (extraClicks[c.id] ?? 0);
    const getPriority = (c: Store) => c.priority ?? 999;
    if (sortBy === "ending") list.sort((a, b) => getExpiryTime(a) - getExpiryTime(b) || getPriority(a) - getPriority(b));
    else if (sortBy === "newest") list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "") || getPriority(a) - getPriority(b));
    else list.sort((a, b) => getClickCount(b) - getClickCount(a) || getPriority(a) - getPriority(b));
    return list;
  }, [coupons, sortBy, clickCounts, extraClicks]);

  return (
    <>
      {revealingCoupon && (
        <CouponRevealModal
          key={revealingCoupon.storeId}
          {...revealingCoupon}
          onClose={() => {
            if (typeof window !== "undefined") {
              const u = new URL(window.location.href);
              u.searchParams.delete("copy");
              u.searchParams.delete("shopnow");
              window.history.replaceState(null, "", u.pathname + u.search + u.hash);
            }
            setRevealingCoupon(null);
          }}
          blurBackdrop
        />
      )}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <aside className="order-1 shrink-0 lg:w-72">
          <div className="sticky top-4 space-y-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-800">Special Event</h2>
              <p className="text-sm font-semibold text-zinc-900">{eventName}</p>
              {eventDescription && <p className="mt-2 text-sm text-zinc-600">{eventDescription}</p>}
              <p className="mt-3 text-xs text-zinc-500">{sorted.length} offer{sorted.length !== 1 ? "s" : ""} available</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-600">How to use</h3>
              <ol className="list-inside list-decimal space-y-2 text-sm text-zinc-600">
                <li>Click &quot;Get Code&quot; or &quot;Get Deal&quot; and copy the code if shown.</li>
                <li>Go to the store website and add items to your cart.</li>
                <li>At checkout, paste the code in the promo box and apply.</li>
              </ol>
            </div>
          </div>
        </aside>
        <div className="order-2 min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl">{eventName}</h2>
            <div className="flex items-center gap-2">
              <div className="flex overflow-hidden rounded border border-zinc-200 bg-white">
                <button type="button" onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-zinc-500 hover:bg-zinc-100"}`} aria-label="Grid view">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
                <button type="button" onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-blue-600 text-white" : "text-zinc-500 hover:bg-zinc-100"}`} aria-label="List view">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                </button>
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "ending" | "newest" | "used")} className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="ending">Ending Soon</option>
                <option value="newest">Newest</option>
                <option value="used">Most Used</option>
              </select>
            </div>
          </div>
          <div role="region" aria-label="Coupon list">
            {sorted.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500 shadow-sm">No offers for this event yet. Add coupons from the admin and tag them with this event.</div>
            ) : (
              <ul className={viewMode === "grid" ? "grid gap-5 sm:grid-cols-2 sm:gap-6" : "space-y-6"}>
                {sorted.map((c) => {
                  const href = c.link || c.trackingUrl || "#";
                  const isCode = c.couponType === "code";
                  const param = isCode ? "copy" : "shopnow";
                  const clickUrl = href.startsWith("http") ? `/api/click?storeId=${encodeURIComponent(c.id)}&redirect=${encodeURIComponent(href)}` : href;
                  const dealTitle = (c.couponTitle ?? "").trim() || (isCode ? `Use code ${c.couponCode || ""}` : "Deal");
                  const badge = getBadgeForCoupon(dealTitle, c.countryCodes, { badgeLabel: c.badgeLabel, badgeShipping: c.badgeShipping, badgeOffer: c.badgeOffer });
                  const percent = badge.type === "percent" ? badge.percent : 10;
                  const expiryDate = formatExpiry(c.expiry);
                  const storeName = c.name || "Store";
                  const handleCouponClick = () => {
                    const param = isCode ? "copy" : "shopnow";
                    const samePageUrl = typeof window !== "undefined" ? window.location.pathname + "?" + param + "=" + encodeURIComponent(c.id) : "";
                    window.open(samePageUrl || "?", "_blank", "noopener,noreferrer");
                    window.location.href = clickUrl;
                  };
                  const handleRevealOnly = () => {
                    setRevealingCoupon({
                      code: c.couponCode || "",
                      title: dealTitle,
                      storeName,
                      storeLogo: c.logoUrl || "",
                      redirect: href,
                      storeId: c.id,
                      expiry: expiryDate,
                      isCode,
                      trending: c.trending === true,
                    });
                  };
                  const clickCount = (clickCounts[c.id] ?? 0) + (extraClicks[c.id] ?? 0);
                  return (
                    <li key={c.id} id={`o-${encodeURIComponent(c.id)}`} className={`flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-md ${viewMode === "grid" ? "items-stretch gap-5 p-6" : "sm:flex-row sm:items-center sm:gap-6 sm:p-6"}`}>
                      <div className="flex shrink-0 items-center justify-center">
                        <div className="flex h-24 w-24 flex-shrink-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-full bg-gradient-to-br from-amber-400 to-orange-500 px-1.5 py-1 text-center text-white shadow-inner sm:h-28 sm:w-28">
                          {badge.type === "text" ? (
                            <>
                              <span className="break-words text-center text-xs font-bold leading-tight sm:text-sm">{badge.line1}</span>
                              {badge.line2 && <span className="break-words text-center text-[7px] font-semibold leading-tight opacity-95 sm:text-[8px]">{badge.line2}</span>}
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
                      <div className={`flex min-w-0 flex-1 flex-col items-start p-5 pt-0 ${viewMode === "list" ? "sm:flex-row sm:items-center sm:justify-between sm:pt-5" : "sm:pt-0"}`}>
                        <div className="min-w-0 w-full flex-1 space-y-2 text-left">
                          {c.trending === true && <span className="mb-1 inline-block rounded bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">Exclusive</span>}
                          <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {expiryDate}
                          </p>
                          <p className="text-xs font-medium text-zinc-600">{storeName}</p>
                          <button type="button" onClick={handleRevealOnly} className="w-full break-words text-left font-bold text-zinc-900 transition hover:text-blue-600 cursor-pointer whitespace-normal">
                            {dealTitle && dealTitle !== "Deal" ? dealTitle : `${percent}% Off - Limited Time`}
                          </button>
                          <p className="flex items-center gap-1 text-xs text-zinc-500">
                            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122m2.122-10.606l2.12 2.122M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {clickCount} click{clickCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="mt-5 flex w-full flex-shrink-0 items-center justify-start gap-3 sm:mt-0 sm:w-auto">
                          <button type="button" onClick={handleCouponClick} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                            {isCode ? "GET CODE" : "GET DEAL"}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
