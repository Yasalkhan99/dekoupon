"use client";

import Link from "next/link";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type Props = { activeLetter: string | null };

export default function BrandsAlphabetBar({ activeLetter }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="navigation" aria-label="Filter brands by letter">
      <Link
        href="/promotions/brands"
        className={`min-w-[2rem] rounded px-2.5 py-1.5 text-center text-sm font-medium transition ${
          !activeLetter
            ? "bg-[var(--footer-accent)] text-white shadow-sm"
            : "bg-zinc-100 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-900"
        }`}
      >
        All
      </Link>
      <Link
        href="/promotions/brands?letter=0-9"
        className={`min-w-[2rem] rounded px-2.5 py-1.5 text-center text-sm font-medium transition ${
          activeLetter === "0-9"
            ? "bg-[var(--footer-accent)] text-white shadow-sm"
            : "bg-zinc-100 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-900"
        }`}
      >
        0-9
      </Link>
      {LETTERS.map((char) => (
        <Link
          key={char}
          href={`/promotions/brands?letter=${char}`}
          className={`min-w-[2rem] rounded px-2.5 py-1.5 text-center text-sm font-medium transition ${
            activeLetter === char
              ? "bg-[var(--footer-accent)] text-white shadow-sm"
              : "bg-zinc-100 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-900"
          }`}
        >
          {char}
        </Link>
      ))}
    </div>
  );
}
