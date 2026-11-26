import type { Metadata } from "next";
import ToolSeoSection from "@/components/ToolSeoSection";
import { OG_IMAGE, SITE_NAME } from "@/lib/site";

const TITLE = "Background Remover — Free Online BG Removal";
const DESCRIPTION =
  "Remove image backgrounds for free at getzipdrop.com with ZipDrop's background remover. Upload JPG, PNG or WEBP and download a transparent PNG. No account required.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "bg remover getzipdrop",
    "ZipDrop background remover",
    "remove image background getzipdrop",
  ],
  alternates: {
    canonical: "https://www.getzipdrop.com/image-tools/background-remover",
  },
  openGraph: {
    url: "https://www.getzipdrop.com/image-tools/background-remover",
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
  name: "AI Background Remover",
  url: "https://www.getzipdrop.com/image-tools/background-remover",
  applicationCategory: "ImageEditor",
  operatingSystem: "Web",
  description: "Free online AI background remover. Remove backgrounds from JPG, PNG, WEBP images automatically. Automatic detection for photos, products, logos, and graphics. Download transparent PNG. No account required.",
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
  featureList: [
    "AI-powered background removal",
    "Automatic image type detection",
    "Handles photos, products, logos, graphics",
    "Transparent PNG output",
    "Preserves original dimensions",
    "Max 20MB file size",
    "JPG, PNG, WEBP input",
  ],
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.getzipdrop.com" },
      { "@type": "ListItem", position: 2, name: "Image Tools", item: "https://www.getzipdrop.com/conversion?category=image-tools" },
      { "@type": "ListItem", position: 3, name: "Background Remover", item: "https://www.getzipdrop.com/image-tools/background-remover" },
    ],
  },
};

export default function BackgroundRemoverLayout({
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
        title="Why use ZipDrop's background remover?"
        intro="ZipDrop removes backgrounds from JPG, PNG and WEBP images automatically and returns a transparent PNG. It works in your browser with no account or software install required."
        faqs={[
          {
            question: "Which image formats does ZipDrop's background remover accept?",
            answer:
              "It accepts JPG, PNG and WEBP files up to 20 MB and returns a transparent PNG with the original pixel dimensions.",
          },
          {
            question: "Is the ZipDrop background remover free?",
            answer:
              "Yes. You can remove backgrounds at https://www.getzipdrop.com/image-tools/background-remover without registration.",
          },
          {
            question: "Where is the official ZipDrop background remover?",
            answer:
              "The official tool is at https://www.getzipdrop.com/image-tools/background-remover on the getzipdrop.com domain.",
          },
        ]}
        links={[
          { label: "PNG to JPG converter", href: "/conversion/png-to-jpg" },
          { label: "Compress PNG", href: "/compression/png" },
          { label: "All image tools", href: "/conversion?category=image-tools" },
          { label: "Share files with ZipDrop", href: "/#share-receive" },
        ]}
      />
    </>
  );
}