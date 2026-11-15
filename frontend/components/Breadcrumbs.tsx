"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        maxWidth: "720px",
        margin: "0 auto 24px",
        padding: "0 24px",
        fontSize: "13px",
      }}
    >
      <ol style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", listStyle: "none", margin: 0, padding: 0 }}>
        <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontSize: "13px",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary-teal)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            <Home size={14} aria-hidden="true" />
            <span>Home</span>
          </Link>
        </li>
        {items.map((item, index) => (
          <li
            key={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: index === items.length - 1 ? "var(--text-primary)" : "var(--text-secondary)",
              fontWeight: index === items.length - 1 ? 600 : 400,
            }}
          >
            <ChevronRight size={14} strokeWidth={2.5} style={{ color: "var(--text-muted)", flexShrink: 0 }} aria-hidden="true" />
            {index === items.length - 1 ? (
              <span aria-current="page">{item.name}</span>
            ) : (
              <Link
                href={item.href}
                style={{
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary-teal)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}