import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Organize PDF Pages – Reorder, Rotate and Delete Pages Online Free",
  description:
    "Organize PDF pages online for free with ZipDrop. Reorder pages visually, rotate pages, delete unwanted pages, and download the organized PDF. No account required.",
  alternates: {
    canonical: "https://www.getzipdrop.com/pdf/organize",
  },
  openGraph: {
    url: "https://www.getzipdrop.com/pdf/organize",
    title: "Organize PDF Pages – Reorder, Rotate and Delete Pages Online Free",
    description:
      "Reorder, rotate and delete PDF pages visually, then download the organized PDF. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Organize PDF Pages – Reorder, Rotate and Delete Pages Online Free",
    description:
      "Reorder, rotate and delete PDF pages visually, then download the organized PDF. No account required.",
    images: ["/og-image.png"],
  },
};

export default function PdfOrganizeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}