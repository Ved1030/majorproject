import type { Metadata } from "next";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/conversion/pdf-to-word";
const TITLE = "PDF to Word Converter – Free Online, No Sign-up";
const DESCRIPTION =
  "Convert PDF to editable Word (DOCX) online for free. Keep text and tables. No watermark, no login.";
const URL = `${SITE_URL}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "convert pdf to word",
    "pdf to word online free",
    "pdf to docx editable",
    "pdf to word layout preserved",
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

export default function PdfToWordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
