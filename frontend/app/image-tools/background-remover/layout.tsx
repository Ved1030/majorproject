import type { Metadata } from "next";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/image-tools/background-remover";
const TITLE = "Remove Image Background Free – One Click, No Sign-up";
const DESCRIPTION =
  "Remove the background from any photo in one click. Free, no watermark, with a transparent PNG download.";
const URL = `${SITE_URL}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "background remover online free",
    "remove image background ai",
    "transparent png maker",
    "remove bg from photo online",
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

export default function BackgroundRemoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
