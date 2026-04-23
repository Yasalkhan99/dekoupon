"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useBlogData } from "@/components/BlogDataProvider";
import type { NavDropdownPost } from "@/data/blog";
import { getBlogImageAspectClass } from "@/data/blog";
import { stripHtml } from "@/lib/slugify";

type HeaderProps = {
  transparent?: boolean;
};

const MenuIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path d="M4 6h16v1.5H4V6zm0 5.25h16v1.5H4v-1.5zm0 5.25h16V18H4v-1.5z" />
  </svg>
);

const ChevronDown = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const navLinks = [
  { id: "home", label: "Home", href: "/", activeRed: true, noDropdown: true },
  { id: "fashion", label: "Fashion & style", href: "/blog/category/fashion", dropdownKey: "fashion" as const },
  { id: "lifestyle", label: "Living & lifestyle", href: "/blog/category/lifestyle", dropdownKey: "lifestyle" as const },
  { id: "featured", label: "Editor's picks", href: "/#latest", dropdownKey: "featured" as const },
  { id: "promotions", label: "Deals & codes", href: "/promotions" },
  { id: "contact", label: "Get in touch", href: "/contact" },
];

const SCROLL_THRESHOLD = 80;

function DropdownCard({ post }: { post: NavDropdownPost }) {
  const aspectClass = getBlogImageAspectClass(post.imageAspectRatio);
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-stone-200/90 bg-white shadow-sm ring-0 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--nav-accent)]/45 hover:shadow-lg hover:ring-2 hover:ring-[var(--nav-accent-muted)]"
    >
      <div className={`relative w-full overflow-hidden bg-gradient-to-br from-stone-100 to-stone-200/80 ${aspectClass}`}>
        {post.image ? (
          <Image
            src={post.image}
            alt={stripHtml(post.title)}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.04]"
            sizes="240px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-200/60">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Article</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--nav-accent)]">
          {post.category}
        </span>
        <span
          className="line-clamp-2 min-h-[2.5rem] text-[13px] font-bold leading-snug text-stone-800 transition-colors group-hover:text-emerald-800 [&_a]:text-emerald-700 [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: post.title }}
        />
        <span className="mt-auto flex items-center justify-between gap-2 border-t border-stone-100 pt-2.5 text-[11px] text-stone-500">
          <span>{post.date}</span>
          <span className="font-semibold text-[var(--nav-accent)] transition group-hover:translate-x-0.5">
            Read →
          </span>
        </span>
      </div>
    </Link>
  );
}

export default function Header({ transparent }: HeaderProps = {}) {
  const { navDropdownPosts } = useBlogData();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"fashion" | "lifestyle" | "featured" | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpand, setSidebarExpand] = useState<"fashion" | "lifestyle" | "featured" | null>(null);
  const [usDate, setUsDate] = useState<string>("");
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const formatUsDate = () => {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      setUsDate(formatter.format(new Date()));
    };
    formatUsDate();
    const id = setInterval(formatUsDate, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!transparent) return;
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparent]);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const handleDropdownEnter = useCallback((key: "fashion" | "lifestyle" | "featured") => {
    clearCloseTimer();
    setOpenDropdown(key);
  }, [clearCloseTimer]);

  const handleDropdownLeave = useCallback(() => {
    closeTimerRef.current = setTimeout(() => setOpenDropdown(null), 120);
  }, []);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  useEffect(() => {
    setSidebarOpen(false);
    setSidebarExpand(null);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [sidebarOpen]);

  const isLight = transparent && scrolled;
  const textClass = isLight
    ? "text-zinc-800 hover:text-emerald-700"
    : "text-zinc-200 hover:text-[var(--nav-accent-hover)]";
  const iconClass = isLight
    ? "text-zinc-500 hover:text-zinc-800"
    : "text-zinc-500 hover:text-zinc-100";
  const navRailClass = isLight
    ? "rounded-full bg-[var(--nav-rail-light-bg)] p-1 shadow-inner ring-1 ring-[var(--nav-rail-light-ring)]"
    : "rounded-full bg-[var(--nav-rail-dark-bg)] p-1 ring-1 ring-[var(--nav-rail-dark-ring)] backdrop-blur-md";
  const navLinkPillHover = isLight ? "hover:bg-white" : "hover:bg-[var(--nav-link-hover-dark)]";
  const navLinkTypography =
    "whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-semibold tracking-tight transition-colors duration-200";

  return (
    <>
      <header
        className={`site-header sticky top-0 z-50 flex w-full flex-col transition-[color,box-shadow,background] duration-300 ${
          isLight ? "site-header--surface-light" : "site-header--surface-dark"
        }`}
      >
        <div className="site-header__accent h-[3px] w-full shrink-0" aria-hidden />
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 min-h-12 items-stretch justify-between gap-3 sm:h-14 sm:min-h-14 sm:gap-4">
          <Link
            href="/"
            className={`flex shrink-0 items-center gap-2.5 self-center rounded-xl py-0.5 pr-0.5 transition hover:opacity-95 ${isLight ? "" : "hover:bg-white/[0.05]"}`}
            aria-label="Dekoupon"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black shadow-md ring-2 sm:h-10 sm:w-10 sm:text-base ${
                isLight
                  ? "bg-[var(--footer-accent)] text-white ring-stone-200/90"
                  : "bg-[var(--footer-accent)] text-white ring-white/15"
              }`}
              aria-hidden
            >
              D
            </span>
            <span
              className={`min-w-0 max-w-[10rem] truncate text-[0.95rem] font-extrabold leading-none tracking-tight sm:max-w-none sm:text-[1.2rem] ${isLight ? "text-stone-900" : "text-white"}`}
              style={{ fontFamily: "var(--font-nav), system-ui, sans-serif" }}
            >
              <span className={isLight ? "text-emerald-600" : "text-[var(--nav-accent)]"}>Deko</span>
              upon
            </span>
          </Link>

          <nav
            className={`hidden items-center gap-0.5 self-center md:flex lg:gap-1 ${navRailClass}`}
          >
            {navLinks.map((link) => {
              const isRed = "activeRed" in link && link.activeRed && isHome;
              const hasDropdown = !("noDropdown" in link && link.noDropdown) && "dropdownKey" in link && link.dropdownKey;
              const isOpen = hasDropdown && openDropdown === link.dropdownKey;
              let linkClass = textClass;
              if (isRed) {
                linkClass = isLight
                  ? "text-emerald-800 ring-1 ring-emerald-200/90 bg-emerald-50/95 hover:bg-emerald-100 hover:text-emerald-900"
                  : "text-emerald-200 ring-1 ring-emerald-400/30 bg-emerald-500/[0.12] hover:bg-emerald-400/[0.18] hover:text-[var(--nav-home-active-hover)] shadow-[0_0_24px_-10px_rgba(45,212,191,0.35)]";
              } else if (hasDropdown) {
                linkClass = isLight ? "text-zinc-800 hover:!text-emerald-700" : "text-zinc-200 hover:!text-[var(--nav-accent-hover)]";
              }

              if (hasDropdown && link.dropdownKey) {
                const key = link.dropdownKey;
                const posts = navDropdownPosts[key] ?? [];
                const items = posts.length;
                const viewAllHref =
                  key === "fashion"
                    ? "/blog/category/fashion"
                    : key === "lifestyle"
                      ? "/blog/category/lifestyle"
                      : "/#latest";
                const viewAllLabel =
                  key === "fashion"
                    ? "All fashion & style"
                    : key === "lifestyle"
                      ? "All living & lifestyle"
                      : "All latest articles";
                return (
                  <div
                    key={link.id}
                    className={`relative flex items-center ${isOpen ? "z-[60]" : "z-[1]"}`}
                    onMouseEnter={() => handleDropdownEnter(key)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <Link
                      href={link.href}
                      className={`inline-flex items-center gap-1 ${navLinkTypography} ${navLinkPillHover} ${linkClass} ${
                        isOpen ? (isLight ? "!text-emerald-700" : "!text-[var(--nav-accent)]") : ""
                      }`}
                    >
                      {link.label}
                      <ChevronDown className={`h-3.5 w-3.5 shrink-0 opacity-80 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
                    </Link>
                    {items > 0 && (
                      <div
                        className={`absolute left-1/2 top-full z-[60] -translate-x-1/2 pt-0 transition-opacity duration-150 ${
                          isOpen
                            ? "visible pointer-events-auto opacity-100"
                            : "invisible pointer-events-none opacity-0"
                        }`}
                        aria-hidden={!isOpen}
                      >
                        <div className="w-[min(90vw,920px)] rounded-b-2xl border border-t-0 border-stone-200/80 bg-gradient-to-b from-white via-stone-50/95 to-stone-100/90 px-4 py-5 shadow-2xl shadow-stone-900/12">
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                            {posts.map((post, i) => (
                              <DropdownCard key={post.slug ? `${post.slug}-${i}` : `post-${i}`} post={post} />
                            ))}
                          </div>
                          <div className="mt-4 flex justify-center border-t border-stone-200/90 pt-4">
                            <Link
                              href={viewAllHref}
                              className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-500"
                            >
                              {viewAllLabel} →
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={link.id}
                  href={link.href}
                  className={`inline-flex items-center ${navLinkTypography} ${navLinkPillHover} ${linkClass} ${
                    isLight && isRed
                      ? "!text-emerald-800 !ring-emerald-200/90 !bg-emerald-50 hover:!bg-emerald-100"
                      : ""
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex min-w-0 shrink items-center justify-end gap-2 self-center sm:ml-6 sm:gap-4 lg:ml-8 lg:gap-6">
            {usDate ? (
              <span
                className={`hidden max-w-[11rem] truncate text-[11px] font-medium leading-tight sm:max-w-none sm:text-xs sm:leading-normal ${
                  isLight ? "text-stone-500" : "text-[var(--nav-text-muted-on-dark)]"
                }`}
                aria-label="US date"
              >
                {usDate}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className={`inline-flex h-9 min-h-9 shrink-0 items-center justify-center gap-1.5 rounded px-2 text-sm font-medium md:hidden ${textClass}`}
              aria-label="Open menu"
            >
              <MenuIcon className="h-5 w-5 shrink-0" />
              <span className="leading-none">Menu</span>
            </button>
            <button
              type="button"
              className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isLight ? "hover:bg-stone-200/90" : "hover:bg-[var(--nav-link-hover-dark)]"
              } ${iconClass}`}
              aria-label="Search"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <div className="hidden shrink-0 items-center gap-1 sm:gap-2">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isLight ? "hover:bg-stone-200/90" : "hover:bg-[var(--nav-link-hover-dark)]"} ${iconClass}`} aria-label="Facebook">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isLight ? "hover:bg-stone-200/90" : "hover:bg-[var(--nav-link-hover-dark)]"} ${iconClass}`} aria-label="Twitter">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isLight ? "hover:bg-stone-200/90" : "hover:bg-[var(--nav-link-hover-dark)]"} ${iconClass}`} aria-label="Instagram">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.919-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.919.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
            </a>
            <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isLight ? "hover:bg-stone-200/90" : "hover:bg-[var(--nav-link-hover-dark)]"} ${iconClass}`} aria-label="Pinterest">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.124 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.377 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" /></svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isLight ? "hover:bg-stone-200/90" : "hover:bg-[var(--nav-link-hover-dark)]"} ${iconClass}`} aria-label="YouTube">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            </a>
            </div>
          </div>
        </div>
      </div>
    </header>

      {/* Mobile sidebar overlay + panel */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm md:hidden"
            aria-hidden
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="site-header fixed left-0 top-0 z-[101] flex h-full w-[min(320px,88vw)] flex-col text-white shadow-2xl animate-mobile-sidebar-in md:hidden"
            style={{ background: "var(--nav-mobile-bg)" }}
            role="dialog"
            aria-label="Main menu"
          >
            <div className="flex items-center justify-between border-b border-emerald-400/25 px-5 py-4">
              <span className="text-sm font-bold tracking-wide text-white">Menu</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-xl p-2 text-white/80 hover:bg-white/10 hover:text-[var(--nav-accent)]"
                aria-label="Close menu"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-1 flex-col overflow-y-auto py-2">
              {navLinks.map((link) => {
                const hasDropdown = !("noDropdown" in link && link.noDropdown) && "dropdownKey" in link && link.dropdownKey;
                const key = hasDropdown ? link.dropdownKey : null;
                const posts = key ? (navDropdownPosts[key] ?? []) : [];
                const hasItems = posts.length > 0;
                const isExpanded = key && sidebarExpand === key;

                if (hasDropdown && key && hasItems) {
                  return (
                    <div key={link.id} className="border-b border-emerald-500/15">
                      <div className="flex items-center justify-between">
                        <Link
                          href={link.href}
                          onClick={() => setSidebarOpen(false)}
                          className="flex-1 py-3.5 pl-5 pr-2 text-left text-[15px] font-semibold tracking-tight text-white/95 hover:bg-white/[0.06] hover:text-[var(--nav-accent)]"
                        >
                          {link.label}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setSidebarExpand(isExpanded ? null : key)}
                          className="rounded-xl p-2 text-white/80 hover:bg-white/10 hover:text-[var(--nav-accent)]"
                          aria-expanded={!!isExpanded}
                        >
                          <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-emerald-500/12 bg-black/15 pb-2 pl-5 pr-2">
                          {posts.map((post) => (
                            <Link
                              key={post.id}
                              href={`/blog/${post.slug}`}
                              onClick={() => setSidebarOpen(false)}
                              className="mt-2 block text-sm text-white/80 hover:text-[var(--nav-accent)]"
                            >
                              {stripHtml(post.title)}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className="border-b border-emerald-500/15 py-3.5 pl-5 text-[15px] font-semibold tracking-tight text-white/95 hover:bg-white/[0.06] hover:text-[var(--nav-accent)]"
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-emerald-400/25 px-5 py-4">
              <p className="text-xs font-medium text-emerald-100/85">Best deals &amp; coupons</p>
              <div className="mt-3 flex gap-2">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="rounded-xl p-2 text-white/80 hover:bg-white/10 hover:text-[var(--nav-accent)]" aria-label="Facebook">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="rounded-xl p-2 text-white/80 hover:bg-white/10 hover:text-[var(--nav-accent)]" aria-label="Twitter">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="rounded-xl p-2 text-white/80 hover:bg-white/10 hover:text-[var(--nav-accent)]" aria-label="Instagram">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.919-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.919.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0z" /></svg>
                </a>
                <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="rounded-xl p-2 text-white/80 hover:bg-white/10 hover:text-[var(--nav-accent)]" aria-label="Pinterest">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.124 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.377 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" /></svg>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="rounded-xl p-2 text-white/80 hover:bg-white/10 hover:text-[var(--nav-accent)]" aria-label="YouTube">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                </a>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
