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
  { name: "Black Friday Deals", slug: "black-friday", description: "Best Black Friday coupons and deals" },
  { name: "Christmas Deals", slug: "christmas", description: "Holiday and Christmas discount codes" },
  { name: "Cyber Monday Deals", slug: "cyber-monday", description: "Cyber Monday offers and promo codes" },
  { name: "Halloween Deals", slug: "halloween", description: "Halloween sales and coupons" },
];

export const SPECIAL_EVENT_SLUGS = SPECIAL_EVENTS.map((e) => e.slug);

export function getEventBySlug(slug: string): SpecialEvent | null {
  const lower = slug.toLowerCase().trim();
  return SPECIAL_EVENTS.find((e) => e.slug === lower) ?? null;
}
