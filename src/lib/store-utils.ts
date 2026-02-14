/**
 * Store/coupon helpers with no Node.js deps — safe to import from Client Components.
 */

import type { Store } from "@/types/store";

const EMPTY_PLACEHOLDERS = ["", "n/a", "na", "—", "-", "none"];

/** Get store's categories as array. Supports legacy single category. */
export function getStoreCategories(store: Store | { category?: string; categories?: string[] }): string[] {
  const cats = store.categories;
  if (Array.isArray(cats) && cats.length > 0) {
    return cats.map((c) => String(c).trim()).filter(Boolean);
  }
  const single = store.category?.trim();
  return single ? [single] : [];
}

function isMeaningfulCouponValue(v: string): boolean {
  const t = v.trim().toLowerCase();
  return t !== "" && !EMPTY_PLACEHOLDERS.includes(t);
}

/** True if this row has coupon/deal data (code or title). Store-only rows return false. */
export function hasCouponData(s: {
  couponCode?: string;
  couponTitle?: string;
}): boolean {
  const code = (s.couponCode ?? "").trim();
  const title = (s.couponTitle ?? "").trim();
  return isMeaningfulCouponValue(code) || isMeaningfulCouponValue(title);
}
