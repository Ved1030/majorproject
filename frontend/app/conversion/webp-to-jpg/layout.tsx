import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WEBP to JPG Converter – Convert WEBP to JPG Free Online",
  description: "Convert WEBP images to widely compatible JPG format online for free. High-quality conversion. No account required, max 50MB.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/conversion/webp-to-jpg",
  },
  openGraph: {
    title: "WEBP to JPG Converter – Convert WEBP to JPG Free Online",
    description: "Convert WEBP images to JPG online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "WEBP to JPG Converter – Convert WEBP to JPG Free Online",
    description: "Convert WEBP to JPG online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "WEBP to JPG Converter",
  url: "https://zip-drop.vercel.app/conversion/webp-to-jpg",
  applicationCategory: "ImageConverter",
  operatingSystem: "Web",
  description: "Free online WEBP to JPG converter. Convert WEBP to widely compatible JPG format. No account required.",
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
      { "@type": "ListItem", position: 3, name: "WEBP to JPG", item: "https://zip-drop.vercel.app/conversion/webp-to-jpg" },
    ],
  },
};

export default function WebpToJpgLayout({
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