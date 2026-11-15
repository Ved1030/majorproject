import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compress PNG Online – Reduce PNG File Size Free",
  description: "Compress PNG images online for free with ZipDrop. Lossless and optimized compression modes. Preserve transparency. No account required.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/compression/png",
  },
  openGraph: {
    title: "Compress PNG Online – Reduce PNG File Size Free",
    description: "Compress PNG images online for free. Lossless and optimized modes. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compress PNG Online – Reduce PNG File Size Free",
    description: "Compress PNG images online for free. Lossless and optimized modes. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Compress PNG",
  url: "https://zip-drop.vercel.app/compression/png",
  applicationCategory: "ImageCompression",
  operatingSystem: "Web",
  description: "Free online PNG compression with lossless and optimized modes. Preserves transparency. No account required.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  creator: {
    "@type": "Organization",
    name: "ZipDrop",
    url: "https://zip-drop.vercel.app",
  },
  featureList: [
    "Lossless compression",
    "Optimized compression",
    "Preserves transparency",
    "No account required",
    "Real compression stats",
  ],
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://zip-drop.vercel.app" },
      { "@type": "ListItem", position: 2, name: "Compression Tools", item: "https://zip-drop.vercel.app/compression" },
      { "@type": "ListItem", position: 3, name: "Compress PNG", item: "https://zip-drop.vercel.app/compression/png" },
    ],
  },
};

export default function CompressPngLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {children}
    </>
  );
}