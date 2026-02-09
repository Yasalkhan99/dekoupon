import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { Store } from "@/types/store";
import { getSupabase, SUPABASE_STORES_TABLE, SUPABASE_COUPONS_TABLE } from "@/lib/supabase-server";
import { getCoupons, insertCoupon, updateCoupon, deleteCouponById } from "@/lib/stores";
import { hasCouponData } from "@/lib/store-utils";

const getStoresPath = () => path.join(process.cwd(), "data", "stores.json");

async function readStoresFromFile(): Promise<Store[]> {
  try {
    const filePath = getStoresPath();
    const data = await readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function readStoresFromSupabase(): Promise<Store[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data: rows, error } = await supabase.from(SUPABASE_STORES_TABLE).select("data");
  if (error) {
    console.error("[stores] Supabase read error:", error.message);
    return [];
  }
  const stores = (rows ?? []).map((r: { data: Store }) => r.data).filter(Boolean);
  stores.sort((a, b) => {
    const aAt = a.createdAt ?? "";
    const bAt = b.createdAt ?? "";
    return bAt.localeCompare(aAt);
  });
  return stores;
}

async function readStores(): Promise<Store[]> {
  if (getSupabase()) return readStoresFromSupabase();
  return readStoresFromFile();
}

async function writeStoresToFile(stores: Store[]) {
  const filePath = getStoresPath();
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, JSON.stringify(stores, null, 2), "utf-8");
}

async function writeStores(stores: Store[]) {
  if (!getSupabase()) return writeStoresToFile(stores);
  const supabase = getSupabase()!;
  const { error: delErr } = await supabase.from(SUPABASE_STORES_TABLE).delete().neq("id", " ");
  if (delErr) throw new Error(delErr.message);
  if (stores.length === 0) return;
  const rows = stores.map((s) => ({ id: s.id, data: s }));
  const { error } = await supabase.from(SUPABASE_STORES_TABLE).insert(rows);
  if (error) throw new Error(error.message);
}

async function insertStore(store: Store) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from(SUPABASE_STORES_TABLE).insert({ id: store.id, data: store });
  if (error) throw new Error(error.message);
}

async function updateStore(id: string, store: Store) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from(SUPABASE_STORES_TABLE).update({ data: store }).eq("id", id);
  if (error) throw new Error(error.message);
}

async function deleteStoreById(id: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from(SUPABASE_STORES_TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

async function deleteAllStoresFromSupabase() {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from(SUPABASE_STORES_TABLE).delete().neq("id", " ");
  if (error) throw new Error(error.message);
}

export async function GET() {
  const stores = await readStores();
  return NextResponse.json(stores);
}

function buildStoreFromBody(body: Record<string, unknown>, slugFromName: string): Store {
  const {
    name,
    logoUrl,
    description,
    expiry,
    link,
    subStoreName,
    storePageHeading,
    slug,
    logoAltText,
    logoMethod,
    trackingUrl,
    countryCodes,
    websiteUrl,
    category,
    whyTrustUs,
    moreInfo,
    shoppingTipsTitle,
    shoppingTips,
    seoTitle,
    seoMetaDesc,
    trending,
    status,
    faqs,
  } = body;
  return {
    id: crypto.randomUUID(),
    name: String(name ?? "").trim(),
    logoUrl: logoUrl ? String(logoUrl).trim() : "",
    description: String(description ?? "").trim(),
    expiry: expiry ? String(expiry).trim() : "Dec 31, 2026",
    link: link ? String(link).trim() : undefined,
    createdAt: new Date().toISOString(),
    ...(subStoreName != null && String(subStoreName).trim() !== "" && { subStoreName: String(subStoreName).trim() }),
    ...(storePageHeading != null && String(storePageHeading).trim() !== "" && { storePageHeading: String(storePageHeading).trim() }),
    ...(slug != null && String(slug).trim() !== "" ? { slug: String(slug).trim() } : { slug: slugFromName }),
    ...(logoAltText != null && String(logoAltText).trim() !== "" && { logoAltText: String(logoAltText).trim() }),
    ...(logoMethod != null && { logoMethod: logoMethod === "upload" ? "upload" : "url" }),
    ...(trackingUrl != null && String(trackingUrl).trim() !== "" && { trackingUrl: String(trackingUrl).trim() }),
    ...(countryCodes != null && String(countryCodes).trim() !== "" && { countryCodes: String(countryCodes).trim() }),
    ...(websiteUrl != null && String(websiteUrl).trim() !== "" && { websiteUrl: String(websiteUrl).trim() }),
    ...(category != null && String(category).trim() !== "" && { category: String(category).trim() }),
    ...(whyTrustUs != null && String(whyTrustUs).trim() !== "" && { whyTrustUs: String(whyTrustUs).trim() }),
    ...(moreInfo != null && String(moreInfo).trim() !== "" && { moreInfo: String(moreInfo).trim() }),
    ...(shoppingTipsTitle != null && String(shoppingTipsTitle).trim() !== "" && { shoppingTipsTitle: String(shoppingTipsTitle).trim() }),
    ...(Array.isArray(shoppingTips) && shoppingTips.length > 0 && { shoppingTips: shoppingTips.filter((t: unknown) => typeof t === "string" && String(t).trim() !== "").map((t: string) => String(t).trim()) }),
    ...(seoTitle != null && String(seoTitle).trim() !== "" && { seoTitle: String(seoTitle).trim() }),
    ...(seoMetaDesc != null && String(seoMetaDesc).trim() !== "" && { seoMetaDesc: String(seoMetaDesc).trim() }),
    ...(trending === true && { trending: true }),
    ...(status === "disable" && { status: "disable" }),
    ...(status === "enable" && { status: "enable" }),
    ...(Array.isArray(faqs) && faqs.length > 0 && { faqs: faqs.filter((f: { q?: string; a?: string }) => (String(f?.q ?? "").trim() !== "" || String(f?.a ?? "").trim() !== "")) }),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Bulk import: body.stores is array
    if (Array.isArray(body.stores) && body.stores.length > 0) {
      const stores = await readStores();
      const created: Store[] = [];
      for (const row of body.stores as Record<string, unknown>[]) {
        const name = row.name != null ? String(row.name).trim() : "";
        const description =
          (row.description != null && String(row.description).trim() !== "" ? String(row.description).trim() : null) ??
          (row.desc != null && String(row.desc).trim() !== "" ? String(row.desc).trim() : null) ??
          (row["Description"] != null && String(row["Description"]).trim() !== "" ? String(row["Description"]).trim() : null) ??
          (row.details != null && String(row.details).trim() !== "" ? String(row.details).trim() : null) ??
          name;
        if (!name) continue;
        const slugFromName = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        // Support multiple column names for logo (Logo URL, logo, logoUrl, etc.)
        const logoUrl =
          (row.logoUrl != null && String(row.logoUrl).trim() !== "" ? String(row.logoUrl).trim() : null) ??
          (row.logo != null && String(row.logo).trim() !== "" ? String(row.logo).trim() : null) ??
          (row["Logo URL"] != null && String(row["Logo URL"]).trim() !== "" ? String(row["Logo URL"]).trim() : null) ??
          (row.logo_url != null && String(row.logo_url).trim() !== "" ? String(row.logo_url).trim() : null) ??
          "";
        const normalizedRow = { ...row, name, description, logoUrl };
        const newStore = buildStoreFromBody(normalizedRow, slugFromName);
        if (row.couponCode != null && String(row.couponCode).trim() !== "") (newStore as Store).couponCode = String(row.couponCode).trim();
        if (row.couponTitle != null && String(row.couponTitle).trim() !== "") (newStore as Store).couponTitle = String(row.couponTitle).trim();
        const typeVal = String((row.couponType ?? row.type ?? "")).trim().toLowerCase();
        if (typeVal === "code") (newStore as Store).couponType = "code";
        else if (typeVal === "deal") (newStore as Store).couponType = "deal";
        if (row.status === "disable") (newStore as Store).status = "disable";
        if (row.status === "enable") (newStore as Store).status = "enable";
        stores.push(newStore);
        created.push(newStore);
      }
      if (created.length === 0) {
        return NextResponse.json({ error: "No valid rows (name required)" }, { status: 400 });
      }
      await writeStores(stores);
      return NextResponse.json({ imported: created.length, stores: created });
    }

    const {
      name,
      logoUrl,
      description,
      expiry,
      link,
      subStoreName,
      storePageHeading,
      slug,
      logoAltText,
      logoMethod,
      trackingUrl,
      countryCodes,
      websiteUrl,
      category,
      whyTrustUs,
      moreInfo,
      shoppingTipsTitle,
      shoppingTips,
      seoTitle,
      seoMetaDesc,
      trending,
      status,
      faqs,
      couponType,
      couponCode,
      couponTitle,
      badgeLabel,
      badgeShipping,
      badgeOffer,
      priority,
      active,
      imageAlt,
      events,
    } = body;
    if (!name || !description) {
      return NextResponse.json(
        { error: "name and description required" },
        { status: 400 }
      );
    }
    if (process.env.VERCEL && !getSupabase()) {
      return NextResponse.json(
        {
          error:
            "Store create is disabled on Vercel until Supabase is set. In Vercel → Project → Settings → Environment Variables add: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then redeploy.",
        },
        { status: 503 }
      );
    }
    const slugFromName = String(name)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const stores = await readStores();
    const newStore = buildStoreFromBody(
      {
        name,
        logoUrl,
        description,
        expiry,
        link,
        subStoreName,
        storePageHeading,
        slug,
        logoAltText,
        logoMethod,
        trackingUrl,
        countryCodes,
        websiteUrl,
        category,
        whyTrustUs,
        moreInfo,
        shoppingTipsTitle,
        shoppingTips,
        seoTitle,
        seoMetaDesc,
        trending,
        status,
        faqs,
      },
      slugFromName
    );
    (newStore as Store).couponType = couponType === "deal" ? "deal" : couponType === "code" ? "code" : undefined;
    if (couponCode != null && String(couponCode).trim() !== "") (newStore as Store).couponCode = String(couponCode).trim();
    if (couponTitle != null && String(couponTitle).trim() !== "") (newStore as Store).couponTitle = String(couponTitle).trim();
    if (badgeLabel != null && String(badgeLabel).trim() !== "") (newStore as Store).badgeLabel = String(badgeLabel).trim();
    if (badgeShipping != null && String(badgeShipping).trim() !== "") (newStore as Store).badgeShipping = String(badgeShipping).trim();
    if (badgeOffer != null && String(badgeOffer).trim() !== "") (newStore as Store).badgeOffer = String(badgeOffer).trim();
    if (priority != null && String(priority) !== "" && !Number.isNaN(Number(priority))) (newStore as Store).priority = Number(priority);
    if (active === false) (newStore as Store).active = false;
    if (active === true) (newStore as Store).active = true;
    if (imageAlt != null && String(imageAlt).trim() !== "") (newStore as Store).imageAlt = String(imageAlt).trim();
    if (Array.isArray(events) && events.length > 0) (newStore as Store).events = events.filter((e: unknown) => typeof e === "string" && e.trim() !== "").map((e: string) => e.trim().toLowerCase());
    const isCoupon = hasCouponData(newStore);
    if (isCoupon) {
      await insertCoupon(newStore);
    } else if (getSupabase()) {
      await insertStore(newStore);
    } else {
      stores.push(newStore);
      await writeStoresToFile(stores);
    }
    return NextResponse.json(newStore);
  } catch (e) {
    let message = e instanceof Error ? e.message : String(e);
    if (/invalid|api key|jwt|unauthorized/i.test(message)) {
      message =
        "Invalid Supabase API key on live site. In Vercel → Project → Settings → Environment Variables, set SUPABASE_SERVICE_ROLE_KEY to the service_role secret (not anon key) from Supabase Dashboard → Project Settings → API, same project as NEXT_PUBLIC_SUPABASE_URL. Then redeploy.";
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all");
    const stores = await readStores();
    const coupons = await getCoupons();
    if (all === "true") {
      if (getSupabase()) {
        await deleteAllStoresFromSupabase();
        const supabase = getSupabase()!;
        const { error: couponErr } = await supabase.from(SUPABASE_COUPONS_TABLE).delete().neq("id", " ");
        if (couponErr) console.error("[coupons] delete all error:", couponErr.message);
      } else {
        await writeStoresToFile([]);
        const { writeFile, mkdir } = await import("fs/promises");
        await mkdir(path.dirname(getStoresPath()), { recursive: true });
        await writeFile(path.join(process.cwd(), "data", "coupons.json"), "[]", "utf-8");
      }
      return NextResponse.json({ deleted: stores.length + coupons.length });
    }
    if (!id) {
      return NextResponse.json({ error: "id or all required" }, { status: 400 });
    }
    const inCoupons = coupons.some((c) => c.id === id);
    if (inCoupons) {
      await deleteCouponById(id);
      return NextResponse.json({ deleted: 1 });
    }
    const nextStores = stores.filter((s) => s.id !== id);
    if (nextStores.length === stores.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (getSupabase()) await deleteStoreById(id);
    else await writeStoresToFile(nextStores);
    return NextResponse.json({ deleted: 1 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const coupons = await getCoupons();
    const couponIndex = coupons.findIndex((c) => c.id === id);
    if (couponIndex >= 0) {
      const current = coupons[couponIndex];
      const allowed = [
        "name", "logoUrl", "description", "expiry", "link", "subStoreName", "slug",
        "logoAltText", "logoMethod", "trackingUrl", "countryCodes",
        "websiteUrl", "category", "whyTrustUs", "moreInfo", "seoTitle", "seoMetaDesc",
        "trending", "status", "faqs", "couponType", "couponCode", "couponTitle", "badgeLabel", "badgeShipping", "badgeOffer", "priority", "active", "imageAlt", "events",
      ];
      const nextCoupon = { ...current };
      for (const key of allowed) {
        if (key in updates && updates[key] !== undefined) {
          if (key === "faqs") (nextCoupon as Record<string, unknown>)[key] = updates[key];
          else if (key === "events") (nextCoupon as Record<string, unknown>)[key] = Array.isArray(updates[key]) ? (updates[key] as unknown[]).filter((e): e is string => typeof e === "string" && e.trim() !== "").map((e) => e.trim().toLowerCase()) : undefined;
          else (nextCoupon as Record<string, unknown>)[key] = typeof updates[key] === "string" ? (updates[key] as string).trim() : updates[key];
        }
      }
      await updateCoupon(id, nextCoupon);
      return NextResponse.json(nextCoupon);
    }
    const stores = await readStores();
    const index = stores.findIndex((s) => s.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const current = stores[index];
    const allowed = [
      "name", "logoUrl", "description", "expiry", "link", "subStoreName", "storePageHeading", "slug",
      "logoAltText", "logoMethod", "trackingUrl", "countryCodes",
      "websiteUrl", "category", "whyTrustUs", "moreInfo", "shoppingTipsTitle", "shoppingTips", "seoTitle", "seoMetaDesc",
      "trending", "status", "faqs", "couponType", "couponCode", "couponTitle", "badgeLabel", "badgeShipping", "badgeOffer", "priority", "active", "imageAlt",
    ];
    const nextStore = { ...current };
    for (const key of allowed) {
      if (key in updates && updates[key] !== undefined) {
        if (key === "faqs") (nextStore as Record<string, unknown>)[key] = updates[key];
        else if (key === "shoppingTips") (nextStore as Record<string, unknown>)[key] = Array.isArray(updates[key]) ? (updates[key] as unknown[]).filter((t): t is string => typeof t === "string" && t.trim() !== "").map((t) => t.trim()) : undefined;
        else (nextStore as Record<string, unknown>)[key] = typeof updates[key] === "string" ? (updates[key] as string).trim() : updates[key];
      }
    }
    if (getSupabase()) await updateStore(id, nextStore);
    else {
      stores[index] = nextStore;
      await writeStoresToFile(stores);
    }
    return NextResponse.json(nextStore);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
