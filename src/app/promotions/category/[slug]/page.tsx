import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import CategoriesSidebar from "@/components/CategoriesSidebar";
import Pagination from "@/components/Pagination";
import PromotionsFooter from "@/components/PromotionsFooter";
import PromotionsHeader from "@/components/PromotionsHeader";
import { getCategoryBySlug } from "@/data/categories";
import { CATEGORY_META } from "@/data/category-meta";
import { getStores, getStoreCategories, slugify } from "@/lib/stores";
import { canonicalUrl } from "@/lib/site";

const PER_PAGE = 24;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: categorySlug } = await params;
  const slugLower = categorySlug.toLowerCase();
  const canonical = canonicalUrl(`/promotions/category/${encodeURIComponent(slugLower)}`);
  const meta = CATEGORY_META[slugLower];
  if (meta) {
    return { title: { absolute: meta.title }, description: meta.description, alternates: { canonical } };
  }
  return { alternates: { canonical } };
}

function categoryToSlug(str: string) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug: categorySlug } = await params;
  const { page: pageStr } = await searchParams;
  const currentPage = Math.max(1, parseInt(String(pageStr || "1"), 10) || 1);
  const slugLower = categorySlug.toLowerCase();
  const stores = await getStores();
  const enabled = stores.filter((s) => s.status !== "disable");

  const fixedCategory = getCategoryBySlug(slugLower);
  const isOther = slugLower === "other";

  let categoryName: string;
  let inCategory: typeof enabled;

  if (fixedCategory) {
    categoryName = fixedCategory.name;
    inCategory = enabled.filter((s) =>
      getStoreCategories(s).some((cat) => categoryToSlug(cat) === slugLower)
    );
  } else if (isOther) {
    categoryName = "Other";
    inCategory = enabled.filter((s) => getStoreCategories(s).length === 0);
  } else {
    notFound();
  }

  const uniqueStores = inCategory.filter(
    (s, i, arr) => arr.findIndex((x) => x.name?.toLowerCase() === s.name?.toLowerCase()) === i
  );
  const totalPages = Math.max(1, Math.ceil(uniqueStores.length / PER_PAGE));
  const pageStores = uniqueStores.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const basePath = `/promotions/category/${categorySlug}`;

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <PromotionsHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-6 text-sm text-zinc-500" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-zinc-700">
                SavingsHub4u
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <Link href="/promotions" className="hover:text-zinc-700">
                Promotions
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <Link href="/promotions/categories" className="hover:text-zinc-700">
                Categories
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li className="text-zinc-900 font-medium">{categoryName}</li>
          </ol>
        </nav>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Left: Category name + stores grid */}
          <div className="min-w-0 flex-1">
            <h1 className="mb-6 text-2xl font-bold text-zinc-900">{categoryName}</h1>
            <p className="mb-4 text-sm text-zinc-500">
              {uniqueStores.length} {uniqueStores.length === 1 ? "brand" : "brands"} in this category
              {totalPages > 1 && (
                <> · Showing {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, uniqueStores.length)}</>
              )}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pageStores.map((store) => (
                <article
                  key={store.id}
                  className="flex flex-col overflow-hidden rounded-lg border border-zinc-100 bg-white p-5 shadow-md transition hover:shadow-lg"
                >
                  {store.logoUrl ? (
                    <div className="relative mb-4 h-16 w-full">
                      <Image
                        src={store.logoUrl}
                        alt={store.name}
                        fill
                        className="object-contain object-left"
                        sizes="200px"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <h2 className="mb-4 text-lg font-bold text-zinc-900">{store.name}</h2>
                  )}
                  <p className="mb-4 flex-1 text-sm text-zinc-600 line-clamp-2">
                    {store.description}
                  </p>
                  <div className="mb-3 text-xs text-zinc-500">
                    Expiry: {store.expiry}
                  </div>
                  <Link
                    href={`/promotions/${store.slug || slugify(store.name)}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    View coupons
                  </Link>
                </article>
              ))}
            </div>
            <Pagination
              basePath={basePath}
              currentPage={currentPage}
              totalPages={totalPages}
              searchParams={pageStr ? { page: pageStr } : {}}
            />
          </div>

          <CategoriesSidebar />
        </div>
      </main>

      <PromotionsFooter />
    </div>
  );
}
