import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Background Remover – Remove Image Backgrounds Free Online",
  description: "Remove backgrounds from images automatically with AI. Upload JPG, PNG, or WEBP and download transparent PNG. Automatic detection handles photos, products, logos, and graphics. Free, no account.",
  alternates: {
    canonical: "https://www.getzipdrop.com/image-tools/background-remover",
  },
  openGraph: {
    url: "https://www.getzipdrop.com/image-tools/background-remover",
    title: "AI Background Remover – Remove Image Backgrounds Free Online",
    description: "Remove backgrounds from images automatically with AI. Upload JPG, PNG, or WEBP and download transparent PNG. Free, no account.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Background Remover – Remove Image Backgrounds Free Online",
    description: "Remove backgrounds from images automatically with AI. Free, no account.",
    images: ["/og-image.png"],
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
    </>
  );
}