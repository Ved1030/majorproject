import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PNG to JPG Converter – Free Online Image Conversion",
  description: "Convert PNG images to compressed JPG online for free. Adjustable quality. No account required.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/conversion/png-to-jpg",
  },
  openGraph: {
    title: "PNG to JPG Converter – Free Online Image Conversion",
    description: "Convert PNG to compressed JPG online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PNG to JPG Converter – Free Online Image Conversion",
    description: "Convert PNG to JPG online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PNG to JPG Converter",
  url: "https://zip-drop.vercel.app/conversion/png-to-jpg",
  applicationCategory: "ImageConverter",
  operatingSystem: "Web",
  description: "Free online PNG to JPG converter. Convert PNG to compressed JPG with adjustable quality. No account required.",
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
      { "@type": "ListItem", position: 3, name: "PNG to JPG", item: "https://zip-drop.vercel.app/conversion/png-to-jpg" },
    ],
  },
};

export default function PngToJpgLayout({
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