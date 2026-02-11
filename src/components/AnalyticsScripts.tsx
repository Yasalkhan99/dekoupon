"use client";

import Script from "next/script";

const GA_ID = "G-FLH2P5CHV8";
const AW_ID = "AW-17945301465"; // Google Ads

export default function AnalyticsScripts() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${AW_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${AW_ID}');
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
