import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, getCookieName } from "@/lib/admin-auth";

/** True for URLs that should stay cacheable (JS chunks, optimized images, public images/fonts). */
function isPublicStaticAsset(pathname: string): boolean {
  if (pathname.startsWith("/_next/static") || pathname.startsWith("/_next/image")) return true;
  return /\.(?:ico|png|jpe?g|gif|webp|svg|woff2?|mp4|webm)$/i.test(pathname);
}

/**
 * Main navigations only — avoid caching HTML so users don't get stuck on stale/offline/error pages
 * until they clear site data (common "connection error" until cache clear).
 */
function shouldSendNoCacheHtml(request: NextRequest): boolean {
  if (request.method !== "GET") return false;
  const dest = request.headers.get("sec-fetch-dest");
  if (dest === "document") return true;
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/html") && !accept.includes("application/json")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    const cookie = request.cookies.get(getCookieName())?.value;
    if (cookie && (await verifySession(cookie))) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const cookie = request.cookies.get(getCookieName())?.value;
    if (!cookie || !(await verifySession(cookie))) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  /** Home: short CDN cache for document (faster repeat / edge TTFB). */
  if (pathname === "/" && shouldSendNoCacheHtml(request)) {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res;
  }

  /** Promotions index: short CDN cache + LCP hero preload (cuts TTFB / LCP resource load delay). */
  const isPromotionsIndex = pathname === "/promotions" || pathname === "/promotions/";
  if (isPromotionsIndex && shouldSendNoCacheHtml(request)) {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    res.headers.set("Link", '</banner-index-2.webp>; rel=preload; as=image; type=image/webp');
    return res;
  }

  if (!isPublicStaticAsset(pathname) && shouldSendNoCacheHtml(request)) {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");
    res.headers.set("Pragma", "no-cache");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image).*)",
  ],
};
