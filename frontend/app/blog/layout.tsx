"use client";

import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: "calc(100vh - 200px)" }}>{children}</main>
      <SiteFooter />
    </>
  );
}