/**
 * Store/brand categories used on /promotions/categories and in admin (Create/Edit Store).
 * Slug is used in URLs: /promotions/category/[slug]
 */
function categorySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export type StoreCategory = {
  name: string;
  slug: string;
};

const NAMES_RAW: string[] = [
  "Beauty and Personal Care",
  "Food And Beverage",
  "Automotive",
  "Baby & Kids",
  "Books & Magazines",
  "Business",
  "Clothing & Accessories",
  "Computers & Software",
  "Education",
  "Electronics",
  "Entertainment",
  "Finance & Insurance",
  "Footwear",
  "Games & Toys",
  "Gifts & Flowers",
  "Health & Fitness",
  "Home & Garden",
  "Internet Service",
  "Jewelry & Watches",
  "Office Supplies",
  "Online Departmental Stores",
  "Online Services",
  "Pet",
  "Photography",
  "Services",
  "Sports & Outdoors",
  "Student",
  "Technology",
  "Telecom",
  "Travel",
  "Women's Fashion",
];

/** Categories sorted A–Z for display (categories page, etc.) */
const NAMES: string[] = [...NAMES_RAW].sort((a, b) =>
  a.localeCompare(b, undefined, { sensitivity: "base" })
);

export const STORE_CATEGORIES: StoreCategory[] = NAMES.map((name) => ({
  name,
  slug: categorySlug(name),
}));

/** Category display names only (for admin dropdown and store.category value). */
export const STORE_CATEGORY_NAMES = NAMES;

/** Get slug for a category name (e.g. for links). */
export function getCategorySlug(name: string): string {
  return categorySlug(name);
}

/** Find category by URL slug. */
export function getCategoryBySlug(slug: string): StoreCategory | null {
  const lower = slug.toLowerCase();
  return STORE_CATEGORIES.find((c) => c.slug === lower) ?? null;
}
