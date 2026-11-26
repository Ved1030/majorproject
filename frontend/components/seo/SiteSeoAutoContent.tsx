"use client";

import { usePathname } from "next/navigation";
import ToolSeoContent from "@/components/seo/ToolSeoContent";
import { getToolSeoContent } from "@/data/toolSeoContent";

export default function SiteSeoAutoContent() {
  const pathname = usePathname() || "/";
  const excluded = ["/", "/editor", "/blog", "/about", "/contact", "/privacy", "/privacy-policy", "/terms"];

  if (excluded.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return null;
  }

  const content = getToolSeoContent(pathname);
  if (!content) return null;

  return (
    <div style={{ width: "100%", paddingBottom: "40px" }}>
      <ToolSeoContent content={content} />
    </div>
  );
}
