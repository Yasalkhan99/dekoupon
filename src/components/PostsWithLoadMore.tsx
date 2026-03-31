"use client";

import { useState } from "react";
import ArticleCard from "@/components/ArticleCard";
import type { BlogPost } from "@/data/blog";

const INITIAL_COUNT = 4;
const LOAD_MORE_COUNT = 2;

type Props = {
  posts: BlogPost[];
  /** Optional: override how many to show initially (default 4) */
  initialCount?: number;
  /** Optional: override how many to add on "Load more" (default 2) */
  loadMoreCount?: number;
  /** Pass `h3` on homepage (sections use `h2`). Default `h2` for category pages under an `h1`. */
  articleTitleHeading?: "h2" | "h3";
};

export default function PostsWithLoadMore({
  posts,
  initialCount = INITIAL_COUNT,
  loadMoreCount = LOAD_MORE_COUNT,
  articleTitleHeading = "h2",
}: Props) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const visible = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;
  const remaining = posts.length - visibleCount;
  const nextCount = Math.min(visibleCount + loadMoreCount, posts.length);

  return (
    <>
      <div className="hunted-row-1-2">
        {visible.map((post) => (
          <ArticleCard key={post.id} post={post} titleHeading={articleTitleHeading} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount(nextCount)}
            className="rounded-lg border-2 border-[var(--footer-accent)] bg-transparent px-6 py-2.5 text-sm font-semibold text-[var(--footer-accent)] transition hover:bg-[var(--footer-accent)] hover:text-white"
          >
            Load more ({remaining} {remaining === 1 ? "article" : "articles"} left)
          </button>
        </div>
      )}
    </>
  );
}
