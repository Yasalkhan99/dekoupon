"use client";

import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/data/blog";
import { getBlogImageAspectClass } from "@/data/blog";
import { stripHtml } from "@/lib/slugify";

type TopDealsSectionProps = {
  posts: BlogPost[];
};

function Card({ post }: { post: BlogPost }) {
  return (
    <Link
      href={post.slug ? `/blog/${post.slug}` : "#"}
      className="group flex shrink-0 flex-col overflow-hidden border-0 border-white/20 bg-[var(--hunted-navy)] transition hover:shadow-xl md:border-2 md:hover:border-[var(--footer-accent)] w-[160px] min-w-[160px] sm:w-[200px] sm:min-w-[200px] md:w-[220px] md:min-w-[220px]"
    >
      <div className={`relative w-full overflow-hidden ${getBlogImageAspectClass(post.imageAspectRatio)}`}>
        <Image
          src={post.image || "https://picsum.photos/id/1/400/300"}
          alt={stripHtml(post.title)}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 20vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--hunted-navy)]/80 to-transparent" />
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3
          className="line-clamp-2 text-sm font-bold leading-snug text-white group-hover:text-[var(--footer-accent)] md:text-base"
          dangerouslySetInnerHTML={{ __html: post.title }}
        />
      </div>
    </Link>
  );
}

export default function TopDealsSection({ posts }: TopDealsSectionProps) {
  const items = posts.slice(0, 5);
  const duplicated = items.length > 0 ? [...items, ...items] : [];

  if (items.length === 0) return null;

  return (
    <section className="bg-[var(--hunted-navy)] py-12 md:py-16">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">
          Top Brand Blogs
        </h2>
        <div className="overflow-hidden">
          <div
            className="top-deals-track flex gap-3 sm:gap-6"
            style={{ width: "max-content" }}
          >
            {duplicated.map((post, i) => (
              <Card key={`${post.id}-${i}`} post={post} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
