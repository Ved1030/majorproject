import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compress JPG Online – Reduce JPG File Size Free",
  description: "Compress JPG images online for free with ZipDrop. Adjustable quality presets (High, Balanced, Smaller, Custom). Progressive JPG option. No account required.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/compression/jpg",
  },
  openGraph: {
    title: "Compress JPG Online – Reduce JPG File Size Free",
    description: "Compress JPG images online for free. Quality presets, progressive option. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compress JPG Online – Reduce JPG File Size Free",
    description: "Compress JPG images online for free. Quality presets. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Compress JPG",
  url: "https://zip-drop.vercel.app/compression/jpg",
  applicationCategory: "ImageCompression",
  operatingSystem: "Web",
  description: "Free online JPG compression with adjustable quality: High, Balanced, Smaller, Custom. Progressive JPG support. No account required.",
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
    "Quality presets",
    "Progressive JPG option",
    "Custom quality slider",
    "Real-time preview",
    "No account required",
  ],
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://zip-drop.vercel.app" },
      { "@type": "ListItem", position: 2, name: "Compression Tools", item: "https://zip-drop.vercel.app/compression" },
      { "@type": "ListItem", position: 3, name: "Compress JPG", item: "https://zip-drop.vercel.app/compression/jpg" },
    ],
  },
};

export default function CompressJpgLayout({
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