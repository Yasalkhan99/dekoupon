"use client";

import { useEffect, useState } from "react";
import type { BlogPost } from "@/data/blog";
import { stripHtml } from "@/lib/slugify";
import { blogListPlaceholderImageUrl, resolveFeaturedFirstImageUrl } from "@/lib/hero-image";

type Props = {
  post: BlogPost;
  /** Seed suffix so fallback differs from primary when both use picsum */
  fallbackKey?: string;
  wrapperClassName?: string;
  imgClassName?: string;
};

export default function ResilientPostImage({
  post,
  fallbackKey = "card",
  wrapperClassName = "relative aspect-video w-full overflow-hidden bg-stone-200",
  imgClassName = "absolute inset-0 h-full w-full object-cover",
}: Props) {
  const primary = resolveFeaturedFirstImageUrl(post.image, post.content, post.slug);
  const fallback = blogListPlaceholderImageUrl(`${post.id}-${fallbackKey}`);
  const [src, setSrc] = useState(primary);

  useEffect(() => {
    setSrc(primary);
  }, [primary]);

  return (
    <div className={wrapperClassName}>
      <img
        src={src}
        alt={stripHtml(post.title)}
        className={imgClassName}
        loading="lazy"
        decoding="async"
        onError={() => setSrc((s) => (s === fallback ? s : fallback))}
      />
    </div>
  );
}
