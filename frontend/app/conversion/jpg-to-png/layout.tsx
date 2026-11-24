import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JPG to PNG Converter – Free Online Image Conversion",
  description: "Convert JPG images to lossless PNG with transparency support online for free. High-quality conversion. No account required.",
  alternates: {
    canonical: "https://www.getzipdrop.com/conversion/jpg-to-png",
  },
  openGraph: {
    url: "https://www.getzipdrop.com/conversion/jpg-to-png",
    title: "JPG to PNG Converter – Free Online Image Conversion",
    description: "Convert JPG to lossless PNG with transparency online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "JPG to PNG Converter – Free Online Image Conversion",
    description: "Convert JPG to PNG with transparency online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JPG to PNG Converter",
  url: "https://www.getzipdrop.com/conversion/jpg-to-png",
  applicationCategory: "ImageConverter",
  operatingSystem: "Web",
  description: "Free online JPG to PNG converter. Convert JPG to lossless PNG with transparency support. No account required.",
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
      { "@type": "ListItem", position: 3, name: "JPG to PNG", item: "https://www.getzipdrop.com/conversion/jpg-to-png" },
    ],
  },
};

export default function JpgToPngLayout({
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