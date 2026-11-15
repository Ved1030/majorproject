import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Script from "next/script";
import SiteFooter from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/site";
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "ZipDrop – Share, Convert, Compress & Edit Files Online Free",
    template: "%s | ZipDrop",
  },

  description:
    "Share files, images, videos and text between devices with ZipDrop's 4-digit code. Convert 30+ formats, compress PDFs and images, remove backgrounds, and edit documents online — no account needed.",

  keywords: [
    "ZipDrop",
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
    "Ved Mehta",
    "Virti Panchamia",
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

  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  openGraph: {
    title: "ZipDrop – Share, Convert, Compress & Edit Files Online Free",
    description:
      "Share files, images, videos and text between devices with a 4-digit code. Convert, compress, edit documents and remove backgrounds online — no account needed.",
    url: SITE_URL,
    siteName: "ZipDrop",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ZipDrop – Share, Convert, Compress & Edit Files Online",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "ZipDrop – Share, Convert, Compress & Edit Files Online Free",
    description:
      "Share files, images, videos and text between devices with a 4-digit code. Convert, compress, edit documents and remove backgrounds online — no account needed.",
    images: ["/og-image.png"],
  },

  category: "technology",
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ZipDrop",
    url: SITE_URL,
    logo: `${SITE_URL}/zipdrop-logo.png`,
    sameAs: [
      "https://github.com/Ved1030",
      "https://www.linkedin.com/in/ved140609/",
      "https://www.linkedin.com/in/virti-panchamia-57a6b82a7/",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-XXXXXXXXXX",
      contactType: "customer service",
      email: "mehtaved12@gmail.com",
      availableLanguage: "English",
    },
    founder: [
      {
        "@type": "Person",
        name: "Ved Mehta",
        affiliation: {
          "@type": "CollegeOrUniversity",
          name: "DJ Sanghvi College of Engineering",
        },
      },
      {
        "@type": "Person",
        name: "Virti Panchamia",
        affiliation: {
          "@type": "CollegeOrUniversity",
          name: "DJ Sanghvi College of Engineering",
        },
      },
    ],
  };

  const webSiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ZipDrop",
    url: SITE_URL,
    publisher: {
      "@type": "Organization",
      name: "ZipDrop",
      url: SITE_URL,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      queryInput: "required name=search_term_string",
    },
  };

  const softwareApplicationData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ZipDrop",
    url: SITE_URL,
    applicationCategory: "FileSharingApplication",
    operatingSystem: "Web",
    description:
      "ZipDrop is a free file and text sharing site that uses a 4-digit code. Convert files, compress files, remove backgrounds, and edit documents in the browser without signing up.",
    creator: [
      {
        "@type": "Person",
        name: "Ved Mehta",
        affiliation: {
          "@type": "CollegeOrUniversity",
          name: "DJ Sanghvi College of Engineering",
        },
      },
      {
        "@type": "Person",
        name: "Virti Panchamia",
        affiliation: {
          "@type": "CollegeOrUniversity",
          name: "DJ Sanghvi College of Engineering",
        },
      },
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    featureList: [
      "File sharing with 4-digit code",
      "Text sharing",
      "30+ file format conversions",
      "PDF compression",
      "Image compression (JPG, PNG, WEBP)",
      "AI background removal",
      "Online document editor",
      "No account required",
    ],
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
        gtag('config', 'G-N4017QP0HN', {
      debug_mode: true,
    });
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

        {/* Structured Data - SoftwareApplication (homepage only via metadata) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationData),
          }}
        />
      </head>

      <body>
        {children}
        <SiteFooter />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}