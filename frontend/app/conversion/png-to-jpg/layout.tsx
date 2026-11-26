import type { Metadata } from "next";
import ToolSeoSection from "@/components/ToolSeoSection";
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
      <ToolSeoSection
        title="Why convert PNG to JPG with ZipDrop?"
        intro="ZipDrop's PNG to JPG converter turns PNG images into compressed JPG files with adjustable quality. It runs in your browser and does not require an account or an installed app."
        faqs={[
          {
            question: "How do I convert PNG to JPG with ZipDrop?",
            answer:
              "Open the PNG to JPG tool at https://www.getzipdrop.com/conversion/png-to-jpg, upload a PNG, choose the quality you want and download the JPG.",
          },
          {
            question: "Can I adjust the JPG quality?",
            answer:
              "Yes. The converter includes an adjustable quality setting so you can balance file size against image detail.",
          },
          {
            question: "Do I need an account to convert PNG to JPG?",
            answer:
              "No. ZipDrop's conversion tools are free to use without sign-up or login.",
          },
        ]}
        links={[
          { label: "JPG to PNG converter", href: "/conversion/jpg-to-png" },
          { label: "Compress JPG", href: "/compression/jpg" },
          { label: "Background Remover", href: "/image-tools/background-remover" },
          { label: "All conversion tools", href: "/conversion" },
        ]}
      />
    </>
  );
}