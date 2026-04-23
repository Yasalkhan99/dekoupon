/**
 * Static marketing pages (about, contact, imprint) — URL unchanged; route group only.
 * Subtle side accent on wide screens + flex column so footer sits after content.
 */
export default function SitePagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--page-bg)] text-zinc-900 antialiased">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-3 bg-gradient-to-b from-[var(--footer-accent)]/25 via-emerald-400/10 to-teal-600/20 xl:block"
        aria-hidden
      />
      <div className="relative flex min-h-0 flex-1 flex-col xl:pl-3">{children}</div>
    </div>
  );
}
