import path from "path";
import { readFile, writeFile, mkdir } from "fs/promises";
import type { Store } from "@/types/store";
import { slugify } from "./slugify";
import { getSupabase, SUPABASE_STORES_TABLE, SUPABASE_COUPONS_TABLE } from "./supabase-server";
import { hasCouponData } from "./store-utils";

const getStoresPath = () => path.join(process.cwd(), "data", "stores.json");
const getCouponsPath = () => path.join(process.cwd(), "data", "coupons.json");

export { slugify };

async function getStoresFromFile(): Promise<Store[]> {
  try {
    const filePath = getStoresPath();
    const data = await readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
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

/** Normalize slug for matching: strip -coupon-code / -coupon so same store matches regardless of URL. */
export function canonicalSlug(s: string): string {
  const lower = s.toLowerCase().trim();
  if (lower.endsWith("-coupon-code")) return lower.slice(0, -"-coupon-code".length);
  if (lower.endsWith("-coupon")) return lower.slice(0, -"-coupon".length);
  return lower;
}

export { hasCouponData } from "./store-utils";

function slugMatches(row: { slug?: string; name?: string }, wantRaw: string, wantCanonical: string): boolean {
  const sSlug = (row.slug || slugify(row.name ?? "")).toLowerCase().trim();
  const sCanonical = canonicalSlug(sSlug);
  const nameSlug = (row.name ?? "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return (
    sSlug === wantRaw ||
    sCanonical === wantCanonical ||
    nameSlug === wantRaw ||
    canonicalSlug(nameSlug) === wantCanonical
  );
}

export async function getStorePageData(slug: string): Promise<StorePageData> {
  const allStores = await getStores();
  const enabledStores = allStores.filter((s) => s.status !== "disable");
  const wantRaw = slug.toLowerCase().trim();
  const wantCanonical = canonicalSlug(wantRaw);
  const matchingStores = enabledStores.filter((s) => slugMatches(s, wantRaw, wantCanonical));
  const storeRow = matchingStores.find((r) => !hasCouponData(r));
  const rowWithLogo = matchingStores.find((r) => (r.logoUrl ?? "").trim() !== "");
  const storeInfo = storeRow ?? rowWithLogo ?? matchingStores[0] ?? null;
  const allCouponsFromTable = await getCoupons();
  const coupons = allCouponsFromTable.filter(
    (c) => c.status !== "disable" && slugMatches(c, wantRaw, wantCanonical)
  );
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
