/**
 * Special event pages: /deals/[slug]
 * Used in footer "Special Event" links and for filtering coupons in admin.
 */
export type SpecialEvent = {
  name: string;
  slug: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
};

export const SPECIAL_EVENTS: SpecialEvent[] = [
  {
    name: "Black Friday Coupons/Deals",
    slug: "black-friday",
    description: "Best Black Friday coupons and deals",
    metaTitle: "Black Friday Coupons & Deals | SavingsHub4U",
    metaDescription:
      "Grab the best Black Friday deals, promo codes, and exclusive discounts at SavingsHub4U. Save big on electronics, fashion, travel, and more this shopping season.",
  },
  {
    name: "Christmas Coupons/Deals",
    slug: "christmas",
    description: "Holiday and Christmas discount codes",
    metaTitle: "Christmas Coupons & Holiday Deals | SavingsHub4U",
    metaDescription:
      "Celebrate the holidays with verified Christmas deals, promo codes, and exclusive discounts on gifts, décor, clothing, and more. Shop smarter this festive season!",
  },
  {
    name: "Cyber Monday Coupons/Deals",
    slug: "cyber-monday",
    description: "Cyber Monday offers and promo codes",
    metaTitle: "Cyber Monday Coupons & Online Deals | SavingsHub4U",
    metaDescription:
      "Score the latest Cyber Monday online deals and promo codes. Save on electronics, fashion, tech gadgets, and more with SavingsHub4U's verified discounts.",
  },
  {
    name: "Easter Coupons/Deals",
    slug: "easter",
    description: "Easter sales and coupons",
    metaTitle: "Easter Coupons & Deals | SavingsHub4U",
    metaDescription: "Easter sales and coupons",
  },
  {
    name: "Halloween Coupons/Deals",
    slug: "halloween",
    description: "Halloween sales and coupons",
    metaTitle: "Halloween Coupons & Spooky Savings | SavingsHub4U",
    metaDescription:
      "Discover Halloween deals, costume discounts, and party supply savings. Find verified promo codes and limited-time offers to make your celebration spooky and budget-friendly.",
  },
];

export const SPECIAL_EVENT_SLUGS = SPECIAL_EVENTS.map((e) => e.slug);

export function getEventBySlug(slug: string): SpecialEvent | null {
  const lower = slug.toLowerCase().trim();
  return SPECIAL_EVENTS.find((e) => e.slug === lower) ?? null;
}
