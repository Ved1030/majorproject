import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "ZipDrop Blog – File Sharing Guides, Tool Comparisons & Tips",
  description: "Guides, comparisons, and tips for sharing files, converting documents, compressing images, and managing your files online with ZipDrop.",
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: "ZipDrop Blog – File Sharing Guides, Tool Comparisons & Tips",
    description: "Guides, comparisons, and tips for sharing files, converting documents, and managing your files online.",
    url: `${SITE_URL}/blog`,
    siteName: "ZipDrop",
    images: ["/og-image.png"],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZipDrop Blog – File Sharing Guides, Tool Comparisons & Tips",
    description: "Guides, comparisons, and tips for sharing files, converting documents, and managing your files online.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "ZipDrop Blog",
  url: `${SITE_URL}/blog`,
  description: "Guides, comparisons, and tips for sharing files, converting documents, compressing images, and managing your files online with ZipDrop.",
  publisher: {
    "@type": "Organization",
    name: "ZipDrop",
    url: SITE_URL,
  },
  blogPosts: [],
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
    ],
  },
};

export default function BlogLayout({
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
      <Navbar />
      <main style={{ minHeight: "calc(100vh - 200px)" }}>{children}</main>
      <SiteFooter />
    </>
  );
}