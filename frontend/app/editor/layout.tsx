import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online Document Editor – Edit Word, PDF & Text Files Free",
  description: "Edit DOCX, PDF, TXT, Markdown and HTML documents in your browser with ZipDrop's free online editor. Full formatting, images, tables, and collaboration. No account required.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/editor",
  },
  openGraph: {
    title: "Online Document Editor – Edit Word, PDF & Text Files Free",
    description: "Edit DOCX, PDF, TXT, Markdown and HTML documents in your browser with ZipDrop's free online editor. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Document Editor – Edit Word, PDF & Text Files Free",
    description: "Edit DOCX, PDF, TXT, Markdown and HTML documents in your browser. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ZipDrop Online Editor",
  url: "https://zip-drop.vercel.app/editor",
  applicationCategory: "DocumentEditor",
  operatingSystem: "Web",
  description: "Free online document editor for Word (DOCX), PDF, TXT, Markdown, and HTML files. Edit with full formatting, images, tables, and share edited copies. No account required.",
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
    "Edit DOCX documents",
    "Convert and edit PDF",
    "Plain text editing",
    "Markdown support",
    "HTML editing",
    "Tables and images",
    "Track changes",
    "Export to DOCX/PDF",
  ],
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://zip-drop.vercel.app" },
      { "@type": "ListItem", position: 2, name: "Online Editor", item: "https://zip-drop.vercel.app/editor" },
    ],
  },
};

export default function EditorLayout({
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