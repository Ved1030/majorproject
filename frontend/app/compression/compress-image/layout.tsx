import type { Metadata } from "next";
import { toolMetadata } from "@/lib/seo";

const TITLE = "Compress JPG, PNG & WEBP Images to Exact KB Size Free";
const DESCRIPTION =
  "Compress JPG, PNG and WEBP images to a target KB size online free. Use 100 KB, 200 KB and 500 KB presets or quality levels, then download without watermark or login.";

export const metadata: Metadata = toolMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/compression/compress-image",
  keywords: [
    "compress image to exact kb",
    "compress jpg to 100kb",
    "compress png online free",
    "compress webp image",
  ],
});

export default function CompressImageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
