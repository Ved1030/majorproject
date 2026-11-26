"use client";

import CompressPdfTool from "@/components/compression/CompressPdfTool";

export default function CompressPdfUnder100KbPage() {
  return <CompressPdfTool defaultTargetKb={100} />;
}
