import type { Metadata } from "next";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/compression/pdf";
const TITLE = "Compress PDF Under 100KB & 200KB Online Free (No Watermark)";
const DESCRIPTION =
  "Compress PDF files online free with target size presets for 100 KB, 200 KB and 500 KB, or Low, Recommended and High levels. No login, no watermark, max 100 MB.";
const URL = `${SITE_URL}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "compress pdf under 100kb",
    "compress pdf to 200kb",
    "compress pdf online free",
    "reduce pdf size no watermark",
    "ZipDrop PDF compressor",
  ],
  alternates: { canonical: URL },
  openGraph: {
    url: URL,
    title: TITLE,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function CompressPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
