import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import BlogDataProvider from "@/components/BlogDataProvider";
import "./globals.css";
import { getBlogData, getDefaultBlogData } from "@/lib/blog";

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
  try {
    blogData = await getBlogData();
  } catch {
    blogData = getDefaultBlogData();
  }
  const GA_ID = "G-FLH2P5CHV8";
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
        <BlogDataProvider
          initialData={{
            heroPost: blogData.heroPost,
            featuredPosts: blogData.featuredPosts,
            mostPopularPosts: blogData.mostPopularPosts,
            latestPosts: blogData.latestPosts,
            trendingPosts: blogData.trendingPosts,
            footerCategories: blogData.footerCategories,
            navDropdownPosts: blogData.navDropdownPosts,
          }}
        >
          {children}
        </BlogDataProvider>
      </body>
    </html>
  );
}
