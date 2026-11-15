import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Online File Compression – PDF, JPG, PNG, WEBP",
  description: "Compress files online for free with ZipDrop. Reduce PDF, JPG, PNG, and WEBP file sizes with quality presets. Bulk compress up to 50 images. No account required.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/compression",
  },
  openGraph: {
    title: "Free Online File Compression – PDF, JPG, PNG, WEBP",
    description: "Compress files online for free with ZipDrop. Reduce PDF, JPG, PNG, and WEBP file sizes with quality presets. Bulk compress up to 50 images. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Online File Compression – PDF, JPG, PNG, WEBP",
    description: "Compress files online for free with ZipDrop. Reduce PDF, JPG, PNG, and WEBP file sizes. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Free Online File Compression",
  description: "Compress files online for free with ZipDrop. Reduce PDF, JPG, PNG, and WEBP file sizes with quality presets. Bulk compress up to 50 images. No account required.",
  url: "https://zip-drop.vercel.app/compression",
  publisher: {
    "@type": "Organization",
    name: "ZipDrop",
    url: "https://zip-drop.vercel.app",
  },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Compress PDF", url: "https://zip-drop.vercel.app/compression/pdf" },
      { "@type": "ListItem", position: 2, name: "Compress JPG", url: "https://zip-drop.vercel.app/compression/jpg" },
      { "@type": "ListItem", position: 3, name: "Compress PNG", url: "https://zip-drop.vercel.app/compression/png" },
      { "@type": "ListItem", position: 4, name: "Compress WEBP", url: "https://zip-drop.vercel.app/compression/webp" },
      { "@type": "ListItem", position: 5, name: "Bulk Image Compressor", url: "https://zip-drop.vercel.app/compression/bulk-images" },
    ],
  },
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://zip-drop.vercel.app" },
      { "@type": "ListItem", position: 2, name: "Compression Tools", item: "https://zip-drop.vercel.app/compression" },
    ],
  },
};

export default function CompressionLayout({
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