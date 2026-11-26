import type { Metadata } from "next";
import { toolMetadata } from "@/lib/seo";

const TITLE = "Compress PDF Under 100KB & 200KB Online Free (No Watermark)";
const DESCRIPTION =
  "Compress a PDF to 100 KB, 200 KB or 500 KB online free. Choose a target size preset or Low, Recommended and High compression. No login, no watermark, works for exam and college uploads.";

export const metadata: Metadata = toolMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/compression/compress-pdf",
  keywords: [
    "compress pdf under 100kb",
    "compress pdf to 200kb",
    "pdf compressor online free",
    "reduce pdf size no watermark",
  ],
});

export default function CompressPdfAliasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
