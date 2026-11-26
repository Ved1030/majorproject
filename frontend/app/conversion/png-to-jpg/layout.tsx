import type { Metadata } from "next";
import { OG_IMAGE, SITE_NAME } from "@/lib/site";

const TITLE = "PNG to JPG — Free Online Image Conversion";
const DESCRIPTION =
  "Convert PNG images to compressed JPG online for free at getzipdrop.com with ZipDrop. Adjustable quality, no account and no software to install.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "png to jpg getzipdrop",
    "file conversion getzipdrop",
    "ZipDrop PNG to JPG converter",
  ],
  alternates: {
    canonical: "https://www.getzipdrop.com/conversion/png-to-jpg",
  },
  openGraph: {
    url: "https://www.getzipdrop.com/conversion/png-to-jpg",
    title: TITLE,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PNG to JPG Converter",
  url: "https://www.getzipdrop.com/conversion/png-to-jpg",
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
    url: "https://www.getzipdrop.com",
  },
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.getzipdrop.com" },
      { "@type": "ListItem", position: 2, name: "Conversion Tools", item: "https://www.getzipdrop.com/conversion" },
      { "@type": "ListItem", position: 3, name: "PNG to JPG", item: "https://www.getzipdrop.com/conversion/png-to-jpg" },
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