import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Merge PDF – Combine Multiple PDF Files Online Free",
  description:
    "Merge multiple PDF files into one document online for free with ZipDrop. Reorder files before merging, then download the combined PDF. No account required.",
  alternates: {
    canonical: "https://www.getzipdrop.com/pdf/merge",
  },
  openGraph: {
    url: "https://www.getzipdrop.com/pdf/merge",
    title: "Merge PDF – Combine Multiple PDF Files Online Free",
    description:
      "Merge multiple PDF files into one document online for free with ZipDrop. Reorder files before merging, then download the combined PDF. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Merge PDF – Combine Multiple PDF Files Online Free",
    description:
      "Merge multiple PDF files into one document online for free with ZipDrop. Reorder files before merging, then download the combined PDF. No account required.",
    images: ["/og-image.png"],
  },
};

export default function PdfMergeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
