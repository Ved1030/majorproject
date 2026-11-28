import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Script from "next/script";
import SiteFooter from "@/components/SiteFooter";
import SiteSeoAutoContent from "@/components/seo/SiteSeoAutoContent";
import AutoProcessedFileShareCta from "@/components/seo/ProcessedFileShareCta";
import {
  AUTHORS,
  BRAND_DESCRIPTION,
  CONTACT_EMAIL,
  GITHUB_URL,
  OG_IMAGE,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_URL,
} from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "ZipDrop – Free Online PDF, Image & File Tools (No Sign-up)",
    template: "%s | ZipDrop",
  },

  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,

  keywords: [
    "ZipDrop",
    "ZipDrop file sharing",
    "ZipDrop file converter",
    "ZipDrop compression",
    "getzipdrop",
    "file sharing getzipdrop",
    "file compression getzipdrop",
    "file sharing",
    "text sharing",
    "file transfer",
    "share files online",
    "4 digit code sharing",
    "online file converter",
    "compress PDF",
    "compress images",
    "remove background",
    "edit documents online",
    "convert PDF to Word",
  ],

  authors: [
    { name: "Ved Mehta" },
    { name: "Virti Panchamia" },
  ],

  creator: "Ved Mehta, Virti Panchamia",
  publisher: "ZipDrop",

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  openGraph: {
    title: "ZipDrop – Free Online PDF, Image & File Tools (No Sign-up)",
    description: SITE_DESCRIPTION,
    url: `${SITE_URL}/`,
    siteName: SITE_NAME,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "ZipDrop — share files and text with a four-digit code",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "ZipDrop – Free Online PDF, Image & File Tools (No Sign-up)",
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },

  category: "technology",
  alternates: {
    canonical: `${SITE_URL}/`,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: BRAND_DESCRIPTION,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/zipdrop-logo.png`,
      width: 2172,
      height: 724,
    },
    sameAs: [GITHUB_URL],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: CONTACT_EMAIL,
      availableLanguage: "English",
    },
    founder: [
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#ved-mehta`,
        name: AUTHORS[0].name,
        url: AUTHORS[0].linkedin,
        sameAs: [AUTHORS[0].linkedin],
        affiliation: {
          "@type": "CollegeOrUniversity",
          name: "DJ Sanghvi College of Engineering",
        },
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#virti-panchamia`,
        name: AUTHORS[1].name,
        url: AUTHORS[1].linkedin,
        sameAs: [AUTHORS[1].linkedin],
        affiliation: {
          "@type": "CollegeOrUniversity",
          name: "DJ Sanghvi College of Engineering",
        },
      },
    ],
    knowsAbout: [
      "File sharing",
      "Text sharing",
      "File conversion",
      "PDF compression",
      "Image compression",
      "Image background removal",
      "Online document editing",
    ],
  };

  const webSiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: BRAND_DESCRIPTION,
    inLanguage: "en",
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
  };

  return (
    <html lang="en">
      <head>
        {/* Google Fonts Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* ✅ Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-N4017QP0HN"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-N4017QP0HN');
      `}
        </Script>

        {/* Structured Data for Google - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationData),
          }}
        />

        {/* Structured Data - WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webSiteData),
          }}
        />
      </head>

      <body>
        {adsenseClient && (
          <Script
            id="google-adsense"
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
          />
        )}
        {children}
        <SiteSeoAutoContent />
        <AutoProcessedFileShareCta />
        <SiteFooter />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}