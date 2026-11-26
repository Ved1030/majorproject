import type { Metadata } from "next";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    default: "Free Online File Compression — PDF, JPG, PNG & WEBP Compressor",
    template: "%s | ZipDrop",
  },
  description: "Compress PDF, JPG, PNG, and WEBP files online with ZipDrop. Choose a quality level, reduce file size, and download the result. No account required.",
  keywords: [
    "file compression getzipdrop",
    "compress pdf getzipdrop",
    "ZipDrop compression tools",
  ],
  alternates: {
    canonical: `${SITE_URL}/compression`,
  },
  openGraph: {
    url: `${SITE_URL}/compression`,
    title: "Free Online File Compression — PDF, JPG, PNG & WEBP Compressor",
    description: "Compress PDF, JPG, PNG, and WEBP files online with ZipDrop. Choose a quality level, reduce file size, and download the result.",
    siteName: SITE_NAME,
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Online File Compression — PDF, JPG, PNG & WEBP Compressor",
    description: "Compress PDF, JPG, PNG, and WEBP files online with ZipDrop. No account required.",
    images: [OG_IMAGE],
  },
};

const tools = [
  { name: "Compress PDF", slug: "pdf" },
  { name: "Compress JPG", slug: "jpg" },
  { name: "Compress PNG", slug: "png" },
  { name: "Compress WEBP", slug: "webp" },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${SITE_URL}/compression#webpage`,
  name: "ZipDrop File Compression",
  description: "Compress PDF, JPG, PNG, and WEBP files online with ZipDrop. Choose a quality level, reduce file size, and download the result.",
  url: `${SITE_URL}/compression`,
  inLanguage: "en",
  isPartOf: { "@id": `${SITE_URL}/#website` },
  publisher: { "@id": `${SITE_URL}/#organization` },
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: tools.length,
    itemListElement: tools.map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: tool.name,
      url: `${SITE_URL}/compression/${tool.slug}`,
    })),
  },
};

const breadcrumbData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Compression Tools", item: `${SITE_URL}/compression` },
  ],
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      {children}
    </>
  );
}
