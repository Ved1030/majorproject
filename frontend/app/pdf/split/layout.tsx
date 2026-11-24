import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Split PDF – Split PDF Files by Page Range Online Free",
  description:
    "Split a PDF into multiple documents online for free with ZipDrop. Split by page ranges, every N pages, or one PDF per page, then download. No account required.",
  alternates: {
    canonical: "https://www.getzipdrop.com/pdf/split",
  },
  openGraph: {
    url: "https://www.getzipdrop.com/pdf/split",
    title: "Split PDF – Split PDF Files by Page Range Online Free",
    description:
      "Split a PDF into multiple documents online for free with ZipDrop. Split by page ranges, every N pages, or one PDF per page, then download. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Split PDF – Split PDF Files by Page Range Online Free",
    description:
      "Split a PDF into multiple documents online for free with ZipDrop. Split by page ranges, every N pages, or one PDF per page, then download. No account required.",
    images: ["/og-image.png"],
  },
};

export default function PdfSplitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
