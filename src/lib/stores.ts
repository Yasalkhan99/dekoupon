import path from "path";
import { readFile, writeFile, mkdir } from "fs/promises";
import type { Store } from "@/types/store";
import { slugify } from "./slugify";
import { getSupabase, SUPABASE_STORES_TABLE, SUPABASE_COUPONS_TABLE } from "./supabase-server";
import { hasCouponData, getStoreCategories } from "./store-utils";

const getStoresPath = () => path.join(process.cwd(), "data", "stores.json");
const getCouponsPath = () => path.join(process.cwd(), "data", "coupons.json");

export { slugify, getStoreCategories };

async function getStoresFromFile(): Promise<Store[]> {
  try {
    const filePath = getStoresPath();
    const data = await readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/** Store categories that map to nav "Fashion" dropdown */
const FASHION_STORE_CATS = ["Clothing & Accessories", "Women's Fashion", "Footwear", "Beauty and Personal Care"];
/** Store categories that map to nav "Lifestyle" dropdown */
const LIFESTYLE_STORE_CATS = ["Home & Garden", "Gifts & Flowers", "Health & Fitness"];

/** Top stores for nav dropdowns (Fashion, Lifestyle) – used in Header. */
export async function getNavStores(): Promise<{ fashion: Store[]; lifestyle: Store[] }> {
  const all = await getStores();
  const enabled = all.filter((s) => s.status !== "disable");
  const byCat = (cats: string[]) =>
    enabled
      .filter((s) => getStoreCategories(s).some((c) => cats.includes(c)))
      .slice(0, 8);
  return {
    fashion: byCat(FASHION_STORE_CATS),
    lifestyle: byCat(LIFESTYLE_STORE_CATS),
  };
}

export async function getStores(): Promise<Store[]> {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data: rows, error } = await supabase.from(SUPABASE_STORES_TABLE).select("data");
      if (!error && rows?.length) {
        const stores = rows.map((r: { data: Store }) => r.data).filter(Boolean);
        stores.sort((a, b) => ((b.createdAt ?? "").localeCompare(a.createdAt ?? "")));
        return stores;
      }
    }
  } catch {
    // Connection closed / network error – fall back to file
  }
  return getStoresFromFile();
}

async function getCouponsFromFile(): Promise<Store[]> {
  try {
    const data = await readFile(getCouponsPath(), "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function sortCouponsByPriority(coupons: Store[]): void {
  coupons.sort((a, b) => {
    const pa = a.priority ?? 999;
    const pb = b.priority ?? 999;
    if (pa !== pb) return pa - pb;
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  });
}

/** All coupons (from Supabase coupons table or data/coupons.json). */
export async function getCoupons(): Promise<Store[]> {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data: rows, error } = await supabase.from(SUPABASE_COUPONS_TABLE).select("data");
      if (!error && rows?.length) {
        const coupons = rows.map((r: { data: Store }) => r.data).filter(Boolean);
        sortCouponsByPriority(coupons);
        return coupons;
      }
    }
  } catch {
    // Connection closed / network error – fall back to file
  }
  const fileCoupons = await getCouponsFromFile();
  sortCouponsByPriority(fileCoupons);
  return fileCoupons;
}

async function writeCouponsToFile(coupons: Store[]) {
  const filePath = getCouponsPath();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(coupons, null, 2), "utf-8");
}

export async function insertCoupon(coupon: Store): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from(SUPABASE_COUPONS_TABLE).insert({ id: coupon.id, data: coupon });
    if (error) throw new Error(error.message);
    return;
  }
  const list = await getCouponsFromFile();
  list.push(coupon);
  await writeCouponsToFile(list);
}

export async function updateCoupon(id: string, coupon: Store): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from(SUPABASE_COUPONS_TABLE).update({ data: coupon }).eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  const list = await getCouponsFromFile();
  const i = list.findIndex((c) => c.id === id);
  if (i === -1) throw new Error("Coupon not found");
  list[i] = coupon;
  await writeCouponsToFile(list);
}

export async function deleteCouponById(id: string): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from(SUPABASE_COUPONS_TABLE).delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  const list = await getCouponsFromFile();
  const next = list.filter((c) => c.id !== id);
  if (next.length === list.length) throw new Error("Coupon not found");
  await writeCouponsToFile(next);
}

export type StorePageData = {
  storeInfo: Store | null;
  coupons: Store[];
  otherStores: Store[];
};

/** Normalize slug for matching: strip common URL suffixes so same store matches regardless of URL. */
export function canonicalSlug(s: string): string {
  let lower = s.toLowerCase().trim();
  const suffixes = ["-discount-code", "-coupon-code", "-promo-code", "-coupon", "-promo", "-discount"];
  for (const suf of suffixes) {
    if (lower.endsWith(suf)) return lower.slice(0, -suf.length);
  }
  return lower;
}

export { hasCouponData } from "./store-utils";

function normalizeForMatch(s: string): string {
  return canonicalSlug(s).toLowerCase().replace(/-/g, "");
}

/** Stricter match for selecting the main store row for a page. */
function storeSlugMatches(row: { slug?: string; name?: string }, wantRaw: string, wantCanonical: string): boolean {
  const sSlug = (row.slug || slugify(row.name ?? "")).toLowerCase().trim();
  const sCanonical = canonicalSlug(sSlug);
  const nameSlug = (row.name ?? "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  // Only allow exact slug / canonical matches for stores so that
  // similar stores like "True Classic Tees" and "True Classic Tees UK"
  // stay separate and don't both match the same URL.
  if (
    sSlug === wantRaw ||
    sCanonical === wantCanonical ||
    nameSlug === wantRaw ||
    canonicalSlug(nameSlug) === wantCanonical
  ) {
    return true;
  }

  return false;
}

/** Match store/coupon row to a page slug (e.g. "magic-hour"). Used for store pages and coupon counts. */
export function slugMatches(row: { slug?: string; name?: string }, wantRaw: string, wantCanonical: string): boolean {
  const sSlug = (row.slug || slugify(row.name ?? "")).toLowerCase().trim();
  const sCanonical = canonicalSlug(sSlug);
  const nameSlug = (row.name ?? "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const wantNorm = normalizeForMatch(wantRaw);
  const rowNorm = normalizeForMatch(sSlug || nameSlug);
  // Exact matches
  if (
    sSlug === wantRaw ||
    sCanonical === wantCanonical ||
    nameSlug === wantRaw ||
    canonicalSlug(nameSlug) === wantCanonical ||
    rowNorm === wantNorm
  ) {
    return true;
  }
  // Coupon slug can be store slug + suffix (e.g. magic-hour-20-off)
  if (wantCanonical.length >= 2 && sCanonical.startsWith(wantCanonical + "-")) return true;
  // Page URL can be store slug + suffix (e.g. /magic-hour-tea-discount-code vs store slug magic-hour-tea)
  if (sCanonical.length >= 2 && wantCanonical.startsWith(sCanonical + "-")) return true;
  // Normalized slug/name starts with page slug (e.g. "Magic Hour - 10% Off" → magichour10off)
  if (wantNorm.length >= 2 && rowNorm.startsWith(wantNorm) && (rowNorm.length === wantNorm.length || /^[-0-9]/.test(rowNorm.slice(wantNorm.length)))) return true;
  return false;
}

export async function getStorePageData(slug: string): Promise<StorePageData> {
  const allStores = await getStores();
  const enabledStores = allStores.filter((s) => s.status !== "disable");
  const wantRaw = slug.toLowerCase().trim();
  const wantCanonical = canonicalSlug(wantRaw);
  // Use stricter matching for the main store row so that stores with
  // similar names (e.g. US vs UK variants) don't collapse into one.
  const matchingStores = enabledStores.filter((s) => storeSlugMatches(s, wantRaw, wantCanonical));
  const allCouponsFromTable = await getCoupons();
  // Store row: strict match (so UK vs US stay separate). Coupons: use slugMatches so coupons
  // whose slug is store slug + suffix (e.g. magic-hour-tea-15-off) still show on store page (magic-hour-tea).
  const coupons = allCouponsFromTable.filter(
    (c) => c.status !== "disable" && slugMatches(c, wantRaw, wantCanonical)
  );
  // Prefer the store whose slug exactly matches the URL (e.g. UK slug "true-classic-tees-discount-code"
  // must show UK store, not US store which has canonical "true-classic-tees" same as UK).
  const exactSlugMatch = (r: Store) =>
    (r.slug || slugify(r.name ?? "")).toLowerCase().trim() === wantRaw;
  const storeRow = matchingStores.find((r) => !hasCouponData(r));
  const rowWithLogo = matchingStores.find((r) => (r.logoUrl ?? "").trim() !== "");
  let storeInfo: Store | null =
    matchingStores.find(exactSlugMatch) ?? storeRow ?? rowWithLogo ?? matchingStores[0] ?? null;
  if (!storeInfo && coupons.length > 0) {
    const first = coupons[0];
    storeInfo = {
      id: first.id,
      name: first.name ?? "Store",
      logoUrl: first.logoUrl ?? "",
      description: first.description ?? `${first.name ?? "Store"} coupons and discount codes.`,
      expiry: first.expiry ?? "Dec 31, 2026",
      link: first.link,
      slug: first.slug ?? slugify(first.name ?? "store"),
      trackingUrl: first.trackingUrl ?? first.link,
      websiteUrl: first.link,
      status: "enable",
    };
  }
  const currentName = storeInfo?.name?.toLowerCase();
  const otherStores = enabledStores
    .filter((s) => s.name?.toLowerCase() !== currentName)
    .reduce((acc: Store[], s) => {
      if (acc.some((x) => x.name?.toLowerCase() === s.name?.toLowerCase())) return acc;
      acc.push(s);
      return acc;
    }, [])
    .slice(0, 12);
  return { storeInfo, coupons, otherStores };
}
