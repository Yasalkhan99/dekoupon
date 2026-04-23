import Link from "next/link";

const MAX_VISIBLE = 5;

export default function Pagination({
  basePath,
  currentPage,
  totalPages,
  searchParams = {},
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
  searchParams?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const qs = new URLSearchParams(searchParams);
  const link = (page: number) => {
    const p = new URLSearchParams(qs);
    if (page > 1) p.set("page", String(page));
    else p.delete("page");
    const query = p.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  let start = Math.max(1, currentPage - Math.floor(MAX_VISIBLE / 2));
  let end = Math.min(totalPages, start + MAX_VISIBLE - 1);
  if (end - start + 1 < MAX_VISIBLE) start = Math.max(1, end - MAX_VISIBLE + 1);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      {prevPage !== null ? (
        <Link
          href={link(prevPage)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Previous
        </Link>
      ) : (
        <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-400" aria-disabled>
          Previous
        </span>
      )}
      <div className="flex items-center gap-1" suppressHydrationWarning>
        {start > 1 && (
          <>
            <Link
              href={link(1)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              1
            </Link>
            {start > 2 && <span className="px-1 text-zinc-400">…</span>}
          </>
        )}
        {pages.map((p) =>
          p === currentPage ? (
            <span
              key={p}
              className="rounded-lg border border-[var(--footer-accent)] bg-[var(--footer-accent)] px-3 py-2 text-sm font-medium text-white"
              aria-current="page"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={link(p)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {p}
            </Link>
          )
        )}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-zinc-400">…</span>}
            <Link
              href={link(totalPages)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {totalPages}
            </Link>
          </>
        )}
      </div>
      {nextPage !== null ? (
        <Link
          href={link(nextPage)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Next
        </Link>
      ) : (
        <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-400" aria-disabled>
          Next
        </span>
      )}
    </nav>
  );
}
