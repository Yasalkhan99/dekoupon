"use client";

import Image from "next/image";
import Link from "next/link";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";

export default function CategoriesSidebar() {
  return (
    <aside className="w-full shrink-0 space-y-6 lg:w-72">
      {/* Search Brands */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <label htmlFor="categories-search" className="sr-only">
          Search Brands
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            id="categories-search"
            type="search"
            placeholder="Search Brands"
            className="w-full rounded-lg border border-zinc-200 py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Affiliate disclaimer – blue box with favicon, links to promotions */}
      <Link
        href="/promotions"
        className="flex flex-col items-center justify-center rounded-2xl bg-blue-600 px-4 py-6 text-center text-white shadow-lg transition hover:bg-blue-700"
      >
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <Image
            src="/fav%20icon%20final%20logo.png"
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 object-contain brightness-0 invert"
          />
        </div>
        <p className="mb-1.5 text-base font-bold">Disclaimer:</p>
        <p className="text-xs leading-relaxed">
          We May Earn Commission
          <br />
          On The Purchases Made
          <br />
          Via Affiliate Link
        </p>
      </Link>

      {/* Newsletter */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-bold text-zinc-900">Subscribe To Our Weekly Newsletter!</h2>
        <NewsletterSubscribe
          placeholder="Enter Your Email"
          buttonText="Subscribe"
          layout="stack"
          className="space-y-3"
          inputClassName="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          buttonClassName="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-teal-700"
        />
      </div>
    </aside>
  );
}
