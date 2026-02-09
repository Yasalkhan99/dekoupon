/**
 * Special event pages: /deals/[slug]
 * Used in footer "Special Event" links and for filtering coupons in admin.
 */
export type SpecialEvent = {
  name: string;
  slug: string;
  description?: string;
};

export const SPECIAL_EVENTS: SpecialEvent[] = [
  { name: "Black Friday Coupons/Deals", slug: "black-friday", description: "Best Black Friday coupons and deals" },
  { name: "Christmas Coupons/Deals", slug: "christmas", description: "Holiday and Christmas discount codes" },
  { name: "Cyber Monday Coupons/Deals", slug: "cyber-monday", description: "Cyber Monday offers and promo codes" },
  { name: "Easter Coupons/Deals", slug: "easter", description: "Easter sales and coupons" },
  { name: "Halloween Coupons/Deals", slug: "halloween", description: "Halloween sales and coupons" },
];

export const SPECIAL_EVENT_SLUGS = SPECIAL_EVENTS.map((e) => e.slug);

export function getEventBySlug(slug: string): SpecialEvent | null {
  const lower = slug.toLowerCase().trim();
  return SPECIAL_EVENTS.find((e) => e.slug === lower) ?? null;
}
