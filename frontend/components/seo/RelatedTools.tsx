import Link from "next/link";
import type { ToolLink } from "@/data/toolSeoContent";
import { ALL_RELATED_TOOLS } from "@/data/toolSeoContent";

export interface RelatedToolsProps {
  links?: ToolLink[];
  title?: string;
}

export default function RelatedTools({
  links = ALL_RELATED_TOOLS,
  title = "Related File Tools",
}: RelatedToolsProps) {
  return (
    <section
      aria-labelledby="related-file-tools-heading"
      style={{
        width: "100%",
        maxWidth: "960px",
        margin: "40px auto 0",
        padding: "0 24px",
      }}
    >
      <h2
        id="related-file-tools-heading"
        style={{
          fontSize: "20px",
          fontWeight: 650,
          color: "var(--text-primary)",
          marginBottom: "16px",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {links.map((link) => (
          <Link
            key={`${link.href}-${link.label}`}
            href={link.href}
            style={{
              display: "block",
              padding: "16px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              color: "var(--primary-teal)",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              lineHeight: 1.5,
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
