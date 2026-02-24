import { NextResponse } from "next/server";
import { getCoupons, insertCoupon, getCouponsPath } from "@/lib/stores";
import type { Store } from "@/types/store";

function slugFromName(name: string): string {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function GET() {
  const coupons = await getCoupons();
  return NextResponse.json(coupons);
}

/** Create a new coupon (saved to Supabase coupons table or data/coupons.json). */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      expiry,
      link,
      logoUrl,
      slug,
      couponType,
      couponCode,
      couponTitle,
      badgeLabel,
      badgeShipping,
      badgeOffer,
      priority,
      active,
      imageAlt,
      trending,
      status,
      events,
    } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: "name and description required" },
        { status: 400 }
      );
    }

    const slugValue =
      slug != null && String(slug).trim() !== ""
        ? String(slug).trim()
        : slugFromName(name);

    const coupon: Store = {
      id: crypto.randomUUID(),
      name: String(name).trim(),
      logoUrl: logoUrl != null ? String(logoUrl).trim() : "",
      description: String(description).trim(),
      expiry: expiry != null ? String(expiry).trim() : "Dec 31, 2026",
      link: link != null && String(link).trim() !== "" ? String(link).trim() : undefined,
      slug: slugValue,
      createdAt: new Date().toISOString(),
      status: status === "disable" ? "disable" : "enable",
      ...(couponType === "code" && { couponType: "code" as const }),
      ...(couponType === "deal" && { couponType: "deal" as const }),
      ...(couponCode != null && String(couponCode).trim() !== "" && { couponCode: String(couponCode).trim() }),
      ...(couponTitle != null && String(couponTitle).trim() !== "" && { couponTitle: String(couponTitle).trim() }),
      ...(badgeLabel != null && String(badgeLabel).trim() !== "" && { badgeLabel: String(badgeLabel).trim() }),
      ...(badgeShipping != null && String(badgeShipping).trim() !== "" && { badgeShipping: String(badgeShipping).trim() }),
      ...(badgeOffer != null && String(badgeOffer).trim() !== "" && { badgeOffer: String(badgeOffer).trim() }),
      ...(priority != null && !Number.isNaN(Number(priority)) && { priority: Number(priority) }),
      ...(active === false && { active: false }),
      ...(active === true && { active: true }),
      ...(imageAlt != null && String(imageAlt).trim() !== "" && { imageAlt: String(imageAlt).trim() }),
      ...(trending === true && { trending: true }),
      ...(Array.isArray(events) && events.length > 0 && {
        events: events.filter((e: unknown) => typeof e === "string" && String(e).trim() !== "").map((e: string) => String(e).trim().toLowerCase()),
      }),
    };

    await insertCoupon(coupon);
    const payload: Record<string, unknown> = { ...coupon };
    if (process.env.NODE_ENV !== "production") {
      payload._savedToFile = getCouponsPath();
    }
    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
