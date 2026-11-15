import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF to PowerPoint Converter – Free Online PPTX Conversion",
  description: "Convert PDF pages to editable PowerPoint (PPTX) slides online for free. Preserve layout and formatting. No account required.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/conversion/pdf-to-ppt",
  },
  openGraph: {
    title: "PDF to PowerPoint Converter – Free Online PPTX Conversion",
    description: "Convert PDF pages to editable PowerPoint slides online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF to PowerPoint Converter – Free Online PPTX Conversion",
    description: "Convert PDF pages to editable PowerPoint slides online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PDF to PowerPoint Converter",
  url: "https://zip-drop.vercel.app/conversion/pdf-to-ppt",
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: "Free online PDF to PowerPoint converter. Convert PDF pages to editable PPTX slides. No account required.",
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
      { "@type": "ListItem", position: 3, name: "PDF to PowerPoint", item: "https://zip-drop.vercel.app/conversion/pdf-to-ppt" },
    ],
  },
};

export default function PdfToPptLayout({
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