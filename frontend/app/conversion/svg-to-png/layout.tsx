import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SVG to PNG Converter – Rasterize Vector SVG to PNG Free Online",
  description: "Convert SVG vector graphics to PNG raster images online for free. Preserve transparency and quality. No account required, max 50MB.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/conversion/svg-to-png",
  },
  openGraph: {
    title: "SVG to PNG Converter – Rasterize Vector SVG to PNG Free Online",
    description: "Convert SVG to PNG with transparency support online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "SVG to PNG Converter – Rasterize Vector SVG to PNG Free Online",
    description: "Convert SVG to PNG online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SVG to PNG Converter",
  url: "https://zip-drop.vercel.app/conversion/svg-to-png",
  applicationCategory: "ImageConverter",
  operatingSystem: "Web",
  description: "Free online SVG to PNG converter. Rasterize vector SVG to PNG with transparency. No account required.",
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
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://zip-drop.vercel.app" },
      { "@type": "ListItem", position: 2, name: "Conversion Tools", item: "https://zip-drop.vercel.app/conversion" },
      { "@type": "ListItem", position: 3, name: "SVG to PNG", item: "https://zip-drop.vercel.app/conversion/svg-to-png" },
    ],
  },
};

export default function SvgToPngLayout({
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