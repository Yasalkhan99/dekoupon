"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { slugify } from "@/lib/slugify";
import StoreSearchAvatar from "@/components/StoreSearchAvatar";

const SITE_NAME = "Dekoupon";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Categories", href: "/promotions/categories" },
  { label: "Brands", href: "/promotions/brands" },
  { label: "Promotions", href: "/promotions" },
  { label: "About Us", href: "/about" },
  { label: "Share A Coupon", href: "/promotions/share-a-coupon" },
];

type StoreSuggestion = {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string;
  logoAltText?: string;
};

function NavLinkPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--footer-accent)] shadow-sm animate-pulse motion-reduce:animate-none" />
  );
}

export default function PromotionsHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [storesList, setStoresList] = useState<StoreSuggestion[]>([]);
  const [hasFetchedStores, setHasFetchedStores] = useState(false);
  const [loadingStores, setLoadingStores] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapperRef = useRef<HTMLFormElement>(null);

  const loadStores = useCallback(async () => {
    if (hasFetchedStores || loadingStores) return;
    try {
      setLoadingStores(true);
      const res = await fetch("/api/stores?suggestions=1", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load stores");
      const data: StoreSuggestion[] = await res.json();
      setStoresList(
        data
          .filter((s) => (s.name || "").trim())
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
      );
      setHasFetchedStores(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStores(false);
    }
  }, [hasFetchedStores, loadingStores]);

  const ensureStoresLoaded = useCallback(() => {
    void loadStores();
  }, [loadStores]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!searchWrapperRef.current?.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const normalizedTerm = searchTerm.trim().toLowerCase();
  const filteredSuggestions = useMemo(() => {
    if (!normalizedTerm) return [];
    return storesList
      .filter((store) => store.name.toLowerCase().startsWith(normalizedTerm))
      .slice(0, 8);
  }, [storesList, normalizedTerm]);

  const handleSelectStore = useCallback(
    (store: StoreSuggestion) => {
      const slug = store.slug || slugify(store.name);
      setShowSuggestions(false);
      setSearchTerm("");
      router.push(`/promotions/${slug}`);
    },
    [router],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && filteredSuggestions.length > 0) {
      event.preventDefault();
      handleSelectStore(filteredSuggestions[0]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredSuggestions.length > 0) handleSelectStore(filteredSuggestions[0]);
    else if (searchTerm.trim()) router.push(`/promotions?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  return (
    <header className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {/* Row 1: Logo + name | Rounded search + orange button | Two circular icons */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={SITE_NAME}>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--footer-accent)] text-sm font-black text-white ring-2 ring-emerald-900/15 sm:h-10 sm:w-10 sm:text-base"
              aria-hidden
            >
              D
            </span>
            <span className="text-[1.05rem] font-extrabold leading-none tracking-tight text-zinc-900 sm:text-[1.2rem]" style={{ fontFamily: "var(--font-nav), system-ui, sans-serif" }}>
              <span className="text-emerald-600">Deko</span>
              upon
            </span>
          </Link>
          <form onSubmit={handleSearchSubmit} className="relative flex flex-1 justify-center md:max-w-md md:px-6" ref={searchWrapperRef}>
            <div className="flex w-full overflow-hidden rounded-full border border-zinc-200 bg-zinc-50/80 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/25">
              <input
                type="search"
                placeholder="Find coupon..."
                value={searchTerm}
                onChange={(e) => {
                  ensureStoresLoaded();
                  setSearchTerm(e.target.value);
                  setShowSuggestions(Boolean(e.target.value));
                }}
                onFocus={() => {
                  ensureStoresLoaded();
                  if (searchTerm.trim()) setShowSuggestions(true);
                }}
                onKeyDown={handleKeyDown}
                className="w-full flex-1 bg-transparent py-2.5 pl-5 pr-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                suppressHydrationWarning
              />
              <button
                type="submit"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--footer-accent)] text-white transition hover:bg-[var(--footer-accent-hover)]"
                aria-label="Search"
                suppressHydrationWarning
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            {showSuggestions && (
              <div className="absolute left-1/2 top-full z-30 mt-2 w-full max-w-md -translate-x-1/2 rounded-2xl border border-zinc-200 bg-white shadow-2xl">
                  {loadingStores ? (
                    <p className="px-4 py-3 text-sm text-zinc-500">Loading stores…</p>
                  ) : normalizedTerm.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-zinc-500">Start typing to search stores</p>
                  ) : filteredSuggestions.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-zinc-500">No stores found for “{searchTerm}”</p>
                  ) : (
                    <ul className="max-h-72 overflow-y-auto">
                      {filteredSuggestions.map((store) => (
                        <li key={store.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectStore(store)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                            suppressHydrationWarning
                          >
                            <StoreSearchAvatar
                              name={store.name}
                              logoUrl={store.logoUrl}
                              logoAltText={store.logoAltText}
                              initialsClassName="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600"
                            />
                            <span className="flex-1 truncate">{store.name}</span>
                            <span className="text-xs uppercase tracking-wide text-[var(--footer-accent)]">View</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
            )}
          </form>
        </div>
        {/* Row 2: Nav links (no dropdowns) */}
        <nav className="mt-4 flex flex-wrap items-center gap-6 border-t border-zinc-100 pt-4 sm:gap-8">
          {navLinks.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`relative inline-flex items-center gap-1.5 pl-0.5 text-sm font-medium transition hover:text-zinc-900 motion-reduce:transition-none ${
                  active ? "text-[var(--footer-accent)]" : "text-zinc-600"
                }`}
              >
                <span className="inline-flex min-w-[10px] shrink-0 justify-center" aria-hidden>
                  <NavLinkPending />
                </span>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
