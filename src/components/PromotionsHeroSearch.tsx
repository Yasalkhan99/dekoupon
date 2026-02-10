"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, useMemo, type KeyboardEvent } from "react";
import { slugify } from "@/lib/slugify";

const DEBOUNCE_MS = 300;

type StoreSuggestion = {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string;
};

export default function PromotionsHeroSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [storesList, setStoresList] = useState<StoreSuggestion[]>([]);
  const [hasFetchedStores, setHasFetchedStores] = useState(false);
  const [loadingStores, setLoadingStores] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const loadStores = useCallback(async () => {
    if (hasFetchedStores || loadingStores) return;
    try {
      setLoadingStores(true);
      const res = await fetch("/api/stores", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load stores");
      const data: StoreSuggestion[] = await res.json();
      const uniqueByName = new Map<string, StoreSuggestion>();
      data.forEach((s) => {
        const key = (s.name || "").trim().toLowerCase();
        if (!key || uniqueByName.has(key)) return;
        uniqueByName.set(key, {
          id: s.id,
          name: s.name,
          slug: s.slug,
          logoUrl: s.logoUrl,
        });
      });
      setStoresList(
        Array.from(uniqueByName.values()).sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
        ),
      );
      setHasFetchedStores(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStores(false);
    }
  }, [hasFetchedStores, loadingStores]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const normalizedTerm = query.trim().toLowerCase();
  const filteredSuggestions = useMemo(() => {
    if (!normalizedTerm) return [];
    return storesList
      .filter((store) => store.name.toLowerCase().startsWith(normalizedTerm))
      .slice(0, 8);
  }, [storesList, normalizedTerm]);

  const applySearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      const url = trimmed ? `/promotions?q=${encodeURIComponent(trimmed)}` : "/promotions";
      router.replace(url);
    },
    [router],
  );

  const handleSelectStore = useCallback(
    (store: StoreSuggestion) => {
      const slug = store.slug || slugify(store.name);
      setShowSuggestions(false);
      setQuery("");
      router.push(`/promotions/${slug}`);
    },
    [router],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      applySearch(value);
    }, DEBOUNCE_MS);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredSuggestions.length > 0) {
      e.preventDefault();
      handleSelectStore(filteredSuggestions[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredSuggestions.length > 0) {
      handleSelectStore(filteredSuggestions[0]);
    } else {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      applySearch(query);
    }
  };

  return (
    <div ref={wrapperRef} className="relative max-w-2xl">
      <form
        onSubmit={handleSubmit}
        className="flex overflow-hidden rounded-2xl border-2 border-zinc-200 bg-white shadow-md transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20"
      >
        <span className="flex items-center pl-5 text-zinc-400" aria-hidden>
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="search"
          name="q"
          value={query}
          onChange={handleChange}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Find coupon or store..."
          className="min-w-0 flex-1 bg-transparent py-4 pl-3 pr-4 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none sm:py-5 sm:pl-4 sm:text-lg"
          autoComplete="off"
        />
        <button
          type="submit"
          className="shrink-0 bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-700 sm:px-8"
        >
          Search
        </button>
      </form>

      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          {loadingStores ? (
            <p className="px-4 py-3 text-sm text-zinc-500">Loading stores…</p>
          ) : normalizedTerm.length === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-500">Start typing to search stores</p>
          ) : filteredSuggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-500">No stores found for &quot;{query.trim()}&quot;</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-2">
              {filteredSuggestions.map((store) => (
                <li key={store.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectStore(store)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-xs font-semibold text-zinc-600">
                      {store.logoUrl ? (
                        <Image
                          src={store.logoUrl}
                          alt={store.name}
                          width={36}
                          height={36}
                          className="h-full w-full object-contain"
                          unoptimized
                        />
                      ) : (
                        store.name.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{store.name}</span>
                    <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-blue-500">View</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
