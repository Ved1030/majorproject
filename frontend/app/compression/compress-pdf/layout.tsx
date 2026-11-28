import type { Metadata } from "next";
import { toolMetadata } from "@/lib/seo";

const TITLE = "Compress PDF Online Free – Reduce to 100KB, 200KB";
const DESCRIPTION =
  "Compress PDF files online for free. Reduce PDF size to 100KB, 200KB or 500KB with no watermark. No sign-up needed.";

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
