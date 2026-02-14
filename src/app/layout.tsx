import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AnalyticsScripts from "@/components/AnalyticsScripts";
import BlogDataProvider from "@/components/BlogDataProvider";
import "./globals.css";
import { getBlogData, getDefaultBlogData } from "@/lib/blog";
import { getNavStores } from "@/lib/stores";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SavingsHub4u – Your Gateway to Smart Savings & Best Coupons",
    template: "%s | SavingsHub4u",
  },
  description:
    "Save smarter with SavingsHub4u. Verified coupon codes, exclusive deals, and money-saving tips from top brands. Your personal savings partner for online shopping.",
  keywords: ["coupons", "deals", "promo codes", "savings", "discounts", "SavingsHub4u"],
  metadataBase: new URL("https://savingshub4u.com"),
  verification: {
    google: "-7AN96PpsD05XVDAVyGYpixzeS5Rb-_ySJ0F2mK5rLs",
  },
  icons: {
    icon: "/fav%20icon%20final%20logo.png",
    apple: "/fav%20icon%20final%20logo.png",
  },
  openGraph: {
    title: "SavingsHub4u – Your Gateway to Smart Savings & Best Coupons",
    description: "Save smarter with verified coupon codes and exclusive deals from top brands. Your personal savings partner.",
    url: "https://savingshub4u.com",
    siteName: "SavingsHub4u",
  },
  twitter: {
    card: "summary_large_image",
    title: "SavingsHub4u – Smart Savings & Best Coupons",
    description: "Verified coupon codes, exclusive deals & money-saving tips. Your personal savings partner.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let blogData;
  let navStores = { fashion: [] as Awaited<ReturnType<typeof getNavStores>>["fashion"], lifestyle: [] as Awaited<ReturnType<typeof getNavStores>>["lifestyle"] };
  try {
    blogData = await getBlogData();
  } catch {
    blogData = getDefaultBlogData();
  }
  try {
    navStores = await getNavStores();
  } catch {
    // Nav stores optional
  }
  return (
    <html lang="en">
      <head>
        <meta name="linkscircleverifycode" content="62dc9b67-2d00-439c-b7ae-c041349c3d42" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AnalyticsScripts />
        <BlogDataProvider
          initialData={{
            heroPost: blogData.heroPost,
            featuredPosts: blogData.featuredPosts,
            mostPopularPosts: blogData.mostPopularPosts,
            latestPosts: blogData.latestPosts,
            trendingPosts: blogData.trendingPosts,
            heroFlowPosts: blogData.heroFlowPosts,
            footerCategories: blogData.footerCategories,
            navDropdownPosts: blogData.navDropdownPosts,
            navDropdownStores: navStores,
            allPosts: blogData.allPosts,
          }}
        >
          {children}
        </BlogDataProvider>
      </body>
    </html>
  );
}
