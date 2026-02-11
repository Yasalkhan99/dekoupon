"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useBlogData } from "@/components/BlogDataProvider";
import { stripHtml } from "@/lib/slugify";
import type { NavDropdownPost } from "@/data/blog";

const TAB_KEYS = ["fashion", "lifestyle", "featured"] as const;
const TAB_LABELS: Record<(typeof TAB_KEYS)[number], string> = {
  fashion: "Fashion",
  lifestyle: "Lifestyle",
  featured: "Featured",
};

function PostRow({ post, index }: { post: NavDropdownPost; index: number }) {
  const num = String(index + 1).padStart(2, "0");
  const href = post.slug ? `/blog/${post.slug}` : "#";
  const img = post.image || "https://picsum.photos/id/1/200/200";

  return (
    <Link
      href={href}
      className="group flex gap-3 rounded-lg p-2 transition hover:bg-white/10"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-200">
        <Image
          src={img}
          alt=""
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="64px"
        />
        <span
          className="absolute left-0 top-0 flex h-6 min-w-[28px] items-center justify-center bg-[var(--footer-accent)] px-1.5 text-xs font-bold text-white"
          aria-hidden
        >
          {num}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          {post.category}
        </p>
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-zinc-900 group-hover:text-[var(--footer-accent)]">
          {stripHtml(post.title)}
        </h3>
        <p className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 12a4 4 0 110-8 4 4 0 010 8zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            SavingsHub4u
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
            </svg>
            {post.date}
          </span>
        </p>
      </div>
    </Link>
  );
}

export default function HeroCategoryTabs() {
  const { navDropdownPosts } = useBlogData();
  const [activeTab, setActiveTab] = useState<(typeof TAB_KEYS)[number]>("fashion");

  const posts = navDropdownPosts[activeTab] ?? [];
  const displayPosts = posts.slice(0, 4);

  return (
    <aside className="flex h-full w-full shrink-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm lg:max-h-[500px] lg:w-80">
      <div className="flex shrink-0 border-b border-zinc-200 px-4 pt-4">
        <div className="flex">
          {TAB_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`relative px-3 pb-2.5 pt-1 text-sm font-medium transition ${
                activeTab === key
                  ? "text-[var(--footer-accent)]"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {TAB_LABELS[key]}
              {activeTab === key && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--footer-accent)]"
                  aria-hidden
                />
              )}
            </button>
          ))}
        </div>
      </div>
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
        {displayPosts.length === 0 ? (
          <li className="py-4 text-center text-sm text-zinc-500">No posts yet.</li>
        ) : (
          displayPosts.map((post, i) => (
            <li key={post.id}>
              <PostRow post={post} index={i} />
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}
