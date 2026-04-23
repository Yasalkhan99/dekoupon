export default function PromotionsLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col animate-pulse" aria-busy="true" aria-label="Loading page">
      <div className="border-b border-emerald-900/10 bg-gradient-to-br from-zinc-900 via-emerald-950 to-zinc-900 px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="space-y-4 lg:col-span-5">
              <div className="h-3 w-28 rounded bg-white/20" />
              <div className="h-10 max-w-md rounded-lg bg-white/15" />
              <div className="h-4 max-w-sm rounded bg-white/10" />
              <div className="h-12 max-w-xl rounded-full bg-white/10" />
            </div>
            <div className="mx-auto min-h-[220px] w-full max-w-md rounded-2xl bg-white/5 lg:col-span-7" />
          </div>
        </div>
      </div>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="space-y-8">
          <div className="h-8 w-48 rounded bg-zinc-200" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 rounded-xl border border-zinc-200 bg-zinc-100/80" />
            ))}
          </div>
          <div className="h-8 w-40 rounded bg-zinc-200" />
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="h-24 rounded-xl border border-zinc-200 bg-zinc-100/80" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
