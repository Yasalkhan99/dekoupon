import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/data/blog";
import { stripHtml } from "@/lib/slugify";

type TopDealsSectionProps = {
  posts: BlogPost[];
};

export default function TopDealsSection({ posts }: TopDealsSectionProps) {
  const items = posts.slice(0, 5);
  if (items.length === 0) return null;

  return (
    <section className="bg-[var(--hunted-navy)] py-12 md:py-16">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">
          Top Deals
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {items.map((post) => (
            <Link
              key={post.id}
              href={post.slug ? `/blog/${post.slug}` : "#"}
              className="group flex flex-col overflow-hidden border-2 border-white/20 bg-[var(--hunted-navy)] transition hover:border-[var(--footer-accent)] hover:shadow-xl"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src={post.image || "https://picsum.photos/id/1/400/300"}
                  alt={stripHtml(post.title)}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--hunted-navy)]/80 to-transparent" />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3
                  className="line-clamp-2 text-sm font-bold leading-snug text-white group-hover:text-[var(--footer-accent)] md:text-base"
                  dangerouslySetInnerHTML={{ __html: post.title }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
