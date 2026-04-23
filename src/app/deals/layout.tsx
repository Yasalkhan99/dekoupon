/** Seasonal / event deals pages under /deals/* */
export default function DealsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--page-bg)] text-zinc-900 antialiased">
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
