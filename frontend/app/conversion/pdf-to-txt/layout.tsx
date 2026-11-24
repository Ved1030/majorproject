import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF to Text Converter – Extract Text from PDF Free Online",
  description: "Extract plain text from PDF documents online for free. Preserve text content and structure. No account required, max 50MB.",
  alternates: {
    canonical: "https://www.getzipdrop.com/conversion/pdf-to-txt",
  },
  openGraph: {
    url: "https://www.getzipdrop.com/conversion/pdf-to-txt",
    title: "PDF to Text Converter – Extract Text from PDF Free Online",
    description: "Extract plain text from PDF documents online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF to Text Converter – Extract Text from PDF Free Online",
    description: "Extract plain text from PDF documents online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PDF to Text Converter",
  url: "https://www.getzipdrop.com/conversion/pdf-to-txt",
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: "Free online PDF to Text converter. Extract plain text from PDF documents. No account required.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  creator: {
    "@type": "Organization",
    name: "ZipDrop",
    url: "https://www.getzipdrop.com",
  },
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.getzipdrop.com" },
      { "@type": "ListItem", position: 2, name: "Conversion Tools", item: "https://www.getzipdrop.com/conversion" },
      { "@type": "ListItem", position: 3, name: "PDF to Text", item: "https://www.getzipdrop.com/conversion/pdf-to-txt" },
    ],
  },
};

export default function PdfToTxtLayout({
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