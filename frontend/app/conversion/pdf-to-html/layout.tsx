import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF to HTML Converter – Convert PDF to HTML Free Online",
  description: "Convert PDF to structured HTML with layout preservation online for free. High-quality conversion. No account required, max 50MB.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/conversion/pdf-to-html",
  },
  openGraph: {
    title: "PDF to HTML Converter – Convert PDF to HTML Free Online",
    description: "Convert PDF to structured HTML with layout preservation online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF to HTML Converter – Convert PDF to HTML Free Online",
    description: "Convert PDF to structured HTML online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PDF to HTML Converter",
  url: "https://zip-drop.vercel.app/conversion/pdf-to-html",
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: "Free online PDF to HTML converter. Convert PDF to structured HTML with layout preservation. No account required.",
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
      { "@type": "ListItem", position: 3, name: "PDF to HTML", item: "https://zip-drop.vercel.app/conversion/pdf-to-html" },
    ],
  },
};

export default function PdfToHtmlLayout({
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