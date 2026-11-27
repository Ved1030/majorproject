"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

interface ToolPageHeaderProps {
  backHref?: string;
  category: string;
  icon?: ReactNode;
  title: string;
  description?: string;
  relatedLinks?: Array<{ href: string; label: string }>;
}

export default function ToolPageHeader({
  backHref,
  category,
  icon,
  title,
  description,
  relatedLinks,
}: ToolPageHeaderProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        {backHref && (
          <Link
            href={backHref}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              textDecoration: "none",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--teal-light)";
              e.currentTarget.style.borderColor = "var(--primary-teal)";
              e.currentTarget.style.color = "var(--primary-teal)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-card)";
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <ArrowLeft size={20} />
          </Link>
        )}

        <div style={{ flex: 1, minWidth: 200 }}>
          <span className="section-label" style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {category}
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap", marginTop: "4px" }}>
            {icon && <span style={{ color: "var(--primary-teal)", flexShrink: 0 }}>{icon}</span>}
            <h1 style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1.2 }}>
              {title}
            </h1>
          </div>
          {description && (
            <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--text-secondary)", margin: "8px 0 0", maxWidth: "560px" }}>
              {description}
            </p>
          )}
        </div>
      </div>

      {relatedLinks && relatedLinks.length > 0 && (
        <nav aria-label="Related tools" style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", justifyContent: "flex-start" }}>
          {relatedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: "var(--primary-teal)",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}