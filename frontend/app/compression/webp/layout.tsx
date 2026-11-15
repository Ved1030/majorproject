import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compress WEBP Online – Reduce WEBP File Size Free",
  description: "Compress WEBP images online for free with ZipDrop. Lossy and lossless compression modes. Preserve transparency and animation. No account required.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/compression/webp",
  },
  openGraph: {
    title: "Compress WEBP Online – Reduce WEBP File Size Free",
    description: "Compress WEBP images online for free. Lossy and lossless modes. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compress WEBP Online – Reduce WEBP File Size Free",
    description: "Compress WEBP images online for free. Lossy and lossless modes. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Compress WEBP",
  url: "https://zip-drop.vercel.app/compression/webp",
  applicationCategory: "ImageCompression",
  operatingSystem: "Web",
  description: "Free online WEBP compression with lossy and lossless modes. Preserves transparency and animation. No account required.",
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
    "Lossy compression",
    "Lossless compression",
    "Preserves transparency",
    "Preserves animation",
    "No account required",
  ],
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://zip-drop.vercel.app" },
      { "@type": "ListItem", position: 2, name: "Compression Tools", item: "https://zip-drop.vercel.app/compression" },
      { "@type": "ListItem", position: 3, name: "Compress WEBP", item: "https://zip-drop.vercel.app/compression/webp" },
    ],
  },
};

export default function CompressWebpLayout({
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