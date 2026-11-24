import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JPG to WEBP Converter – Convert JPG to WEBP Free Online",
  description: "Convert JPG images to modern WEBP format online for free. Smaller file sizes with quality. No account required, max 50MB.",
  alternates: {
    canonical: "https://www.getzipdrop.com/conversion/jpg-to-webp",
  },
  openGraph: {
    url: "https://www.getzipdrop.com/conversion/jpg-to-webp",
    title: "JPG to WEBP Converter – Convert JPG to WEBP Free Online",
    description: "Convert JPG images to WEBP online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "JPG to WEBP Converter – Convert JPG to WEBP Free Online",
    description: "Convert JPG to WEBP online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JPG to WEBP Converter",
  url: "https://www.getzipdrop.com/conversion/jpg-to-webp",
  applicationCategory: "ImageConverter",
  operatingSystem: "Web",
  description: "Free online JPG to WEBP converter. Convert JPG to modern WEBP format. No account required.",
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
      { "@type": "ListItem", position: 3, name: "JPG to WEBP", item: "https://www.getzipdrop.com/conversion/jpg-to-webp" },
    ],
  },
};

export default function JpgToWebpLayout({
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