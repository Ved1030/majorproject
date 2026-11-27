"use client";

import { ReactNode } from "react";

interface ToolPageLayoutProps {
  header: ReactNode;
  leftColumn: ReactNode;
  rightColumn: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export default function ToolPageLayout({
  header,
  leftColumn,
  rightColumn,
  footer,
  maxWidth = "1440px",
}: ToolPageLayoutProps) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-main)" }}>
      <div style={{ maxWidth, margin: "0 auto", padding: "clamp(24px, 4vh, 48px) 24px" }}>
        {header}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.22fr)_minmax(0,1fr)] lg:items-start">
          <section className="min-w-0">
            {leftColumn}
          </section>
          <aside className="min-w-0 space-y-4">
            {rightColumn}
          </aside>
        </div>
        {footer && <div className="mt-2">{footer}</div>}
      </div>
    </div>
  );
}