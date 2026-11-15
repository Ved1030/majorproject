import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF to Word Converter – Free Online DOCX Conversion",
  description: "Convert PDF to editable Word (DOCX) online for free. Choose between Editable mode for editing or Visual Fidelity mode for layout preservation. No account required.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/conversion/pdf-to-word",
  },
  openGraph: {
    title: "PDF to Word Converter – Free Online DOCX Conversion",
    description: "Convert PDF to editable Word (DOCX) online for free. Choose between Editable mode for editing or Visual Fidelity mode for layout preservation. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF to Word Converter – Free Online DOCX Conversion",
    description: "Convert PDF to editable Word (DOCX) online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PDF to Word Converter",
  url: "https://zip-drop.vercel.app/conversion/pdf-to-word",
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: "Free online PDF to Word converter with Editable and Visual Fidelity modes. Convert PDF to editable DOCX without an account.",
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
    "Editable Word mode",
    "Visual Fidelity mode",
    "Layout preservation",
    "Table extraction",
    "Image handling",
    "Max 50MB file size",
    "No account required",
  ],
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://zip-drop.vercel.app" },
      { "@type": "ListItem", position: 2, name: "Conversion Tools", item: "https://zip-drop.vercel.app/conversion" },
      { "@type": "ListItem", position: 3, name: "PDF to Word", item: "https://zip-drop.vercel.app/conversion/pdf-to-word" },
    ],
  },
};

export default function PdfToWordLayout({
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