import type { Metadata } from "next";
import { AUTHORS, SITE_URL } from "@/lib/site";

const url = `${SITE_URL}/blog/snapdrop-alternative`;
const title = "Best Snapdrop Alternative in 2026 – Share Files Across Devices";
const description =
  "Looking for a Snapdrop alternative? ZipDrop shares files and text between devices with a 4-digit code, across different networks, with no account or app required.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: url,
  },
  openGraph: {
    title,
    description,
    url,
    siteName: "ZipDrop",
    type: "article",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
  },
};

const articleData = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: title,
  description,
  url,
  mainEntityOfPage: { "@type": "WebPage", "@id": url },
  author: AUTHORS.map((author) => ({
    "@type": "Person",
    name: author.name,
    url: author.linkedin,
  })),
  publisher: { "@type": "Organization", name: "ZipDrop", url: SITE_URL },
  image: `${SITE_URL}/og-image.png`,
  isPartOf: { "@type": "Blog", name: "ZipDrop Blog", url: `${SITE_URL}/blog` },
};

export default function SnapdropAlternativeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleData) }}
      />
      {children}
    </>
  );
}
