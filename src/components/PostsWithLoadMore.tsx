"use client";

import { useState } from "react";
import ArticleCard from "@/components/ArticleCard";
import type { BlogPost } from "@/data/blog";

const INITIAL_COUNT = 4;
const LOAD_MORE_COUNT = 2;

type Props = {
  posts: BlogPost[];
  initialCount?: number;
  loadMoreCount?: number;
  articleTitleHeading?: "h2" | "h3";
  /** Homepage: vertical editorial feed. Default: two-column classic grid. */
  skin?: "default" | "desk";
};

export default function PostsWithLoadMore({
  posts,
  initialCount = INITIAL_COUNT,
  loadMoreCount = LOAD_MORE_COUNT,
  articleTitleHeading = "h2",
  skin = "default",
}: Props) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const visible = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;
  const remaining = posts.length - visibleCount;
  const nextCount = Math.min(visibleCount + loadMoreCount, posts.length);

  const listClass = skin === "desk" ? "flex flex-col gap-4 sm:gap-5" : "hunted-row-1-2";

  return (
    <>
      <div className={listClass}>
        {visible.map((post) => (
          <ArticleCard
            key={post.id}
            post={post}
            titleHeading={articleTitleHeading}
            skin={skin === "desk" ? "desk" : "default"}
          />
        ))}
      </div>
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount(nextCount)}
            className={
              skin === "desk"
                ? "rounded-md border-2 border-stone-800/20 bg-stone-100/80 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-stone-800 transition hover:border-[var(--footer-accent)] hover:bg-[var(--footer-accent)] hover:text-white"
                : "rounded-lg border-2 border-[var(--footer-accent)] bg-transparent px-6 py-2.5 text-sm font-semibold text-[var(--footer-accent)] transition hover:bg-[var(--footer-accent)] hover:text-white"
            }
          >
            Load more ({remaining} {remaining === 1 ? "article" : "articles"} left)
          </button>
        </div>
      )}
    </>
  );
}
