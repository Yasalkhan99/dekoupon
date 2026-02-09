import Link from "next/link";
import Image from "next/image";
import { STORE_CATEGORIES } from "@/data/categories";

/** Footer events – pehle wale 4 events (labels "X Deals") */
const FOOTER_EVENTS = [
  { name: "Black Friday Deals", slug: "black-friday" },
  { name: "Christmas Deals", slug: "christmas" },
  { name: "Cyber Monday Deals", slug: "cyber-monday" },
  { name: "Halloween Deals", slug: "halloween" },
];

const FAVORITE_CATEGORY_NAMES = [
  "Automotive",
  "Baby & Kids",
  "Beauty and Personal Care",
  "Books & Magazines",
  "Food And Beverage",
];

/**
 * Shared footer for promotions, brands, categories, share-a-coupon, about, and category [slug] pages.
 * Four columns: Logo, Favorite Categories, Important Links, Events.
 * Pass className e.g. "!mt-0" when footer sits directly under newsletter to remove top gap.
 */
export default function PromotionsFooter({ className }: { className?: string }) {
  const favoriteCategories = FAVORITE_CATEGORY_NAMES.map((name) => {
    const cat = STORE_CATEGORIES.find((c) => c.name === name);
    return cat ? { name: cat.name.toUpperCase(), slug: cat.slug } : null;
  }).filter(Boolean) as { name: string; slug: string }[];

  return (
    <footer className={`mt-12 border-t border-zinc-800 bg-black text-white ${className ?? ""}`}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold text-white transition hover:opacity-90">
              <Image src="/final final logo.svg" alt="SavingsHub4u" width={140} height={28} className="h-7 w-auto object-contain" />
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/80">
              SavingsHub4u helps you find the best deals, discount codes and coupons from top stores. Save more on every purchase.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Favorite Categories</h4>
            <ul className="space-y-2 text-sm text-white/80">
              {favoriteCategories.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/promotions/category/${cat.slug}`} className="transition hover:text-blue-400">{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Important Links</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link href="/about" className="transition hover:text-blue-400">About Us</Link></li>
              <li><Link href="/promotions/brands" className="transition hover:text-blue-400">Brands</Link></li>
              <li><Link href="/contact" className="transition hover:text-blue-400">Contact Us</Link></li>
              <li><Link href="/imprint" className="transition hover:text-blue-400">Imprint</Link></li>
              <li><Link href="/promotions/share-a-coupon" className="transition hover:text-blue-400">Share A Coupon</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Events</h4>
            <ul className="space-y-2 text-sm text-white/80">
              {FOOTER_EVENTS.map((ev) => (
                <li key={ev.slug}>
                  <Link href={`/deals/${ev.slug}`} className="transition hover:text-blue-400">{ev.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-800 bg-zinc-900/80 px-4 py-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-white/90">
            © {new Date().getFullYear()} SavingsHub4u. All Rights Reserved.
          </p>
          <div className="flex items-center gap-3">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:border-blue-400 hover:text-blue-400" aria-label="Facebook">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:border-blue-400 hover:text-blue-400" aria-label="Twitter">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:border-blue-400 hover:text-blue-400" aria-label="Instagram">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.919-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.919.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
            </a>
            <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:border-blue-400 hover:text-blue-400" aria-label="Pinterest">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.124 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.377 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" /></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
