export type Store = {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  expiry: string;
  link?: string;
  createdAt?: string;
  // Extended store fields (Manage Stores form)
  subStoreName?: string;
  /** Main heading on store page (e.g. "Valvoline Synthetic Oil Change Discount Code"). If set, used above coupons; else displayName + " Discount Code". */
  storePageHeading?: string;
  slug?: string;
  logoAltText?: string;
  logoMethod?: "url" | "upload";
  trackingUrl?: string;
  faqs?: { q: string; a: string }[];
  networkId?: string;
  merchantId?: string;
  countryCodes?: string;
  websiteUrl?: string;
  category?: string;
  whyTrustUs?: string;
  moreInfo?: string;
  /** Sidebar box below "About Store": content for "{Store name} Codes and Coupons" (admin-editable). */
  codesAndCouponsContent?: string;
  /** Main content: "More About [store name]" section below coupon list (admin-editable, rich text). */
  moreAboutContent?: string;
  /** Shopping Tips section on store page: custom title and bullet points. */
  shoppingTipsTitle?: string;
  shoppingTips?: string[];
  seoTitle?: string;
  seoMetaDesc?: string;
  trending?: boolean;
  status?: "enable" | "disable";
  // Coupon-specific (Manage Coupons form)
  couponType?: "code" | "deal";
  couponCode?: string;
  couponTitle?: string;
  /** Badge on coupon card: any text (e.g. "Free Shipping", "20% OFF", "$10 OFF"). Empty = use store region / percentage. Legacy – prefer badgeShipping + badgeOffer. */
  badgeLabel?: string;
  /** Badge line 2 (or line 1 if no offer): any text e.g. "Free Shipping", "Free Delivery" (optional). */
  badgeShipping?: string;
  /** Badge line 2 (or only line): percentage or amount e.g. "20% OFF", "$10 OFF" (optional). */
  badgeOffer?: string;
  priority?: number;
  active?: boolean;
  imageAlt?: string;
  /** Event slugs (e.g. black-friday, christmas) – coupon shows on /deals/[slug] pages when included */
  events?: string[];
};
