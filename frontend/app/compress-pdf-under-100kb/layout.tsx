import type { Metadata } from "next";
import { toolMetadata } from "@/lib/seo";

const TITLE = "Compress PDF Under 100KB Online Free – No Watermark";
const DESCRIPTION =
  "Reduce a PDF to under 100 KB for SSC, UPSC and college portal uploads. Pick the 100 KB preset, compress your PDF and download the result free without login or watermark.";

export const metadata: Metadata = toolMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/compress-pdf-under-100kb",
  keywords: [
    "compress pdf under 100kb",
    "pdf 100kb compressor",
    "reduce pdf size for exam form",
    "compress pdf 100 kb online free",
  ],
});

export default function CompressPdf100KbLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
