"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface UnifiedToolHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  backHref: string;
  backLabel?: string;
  icon: ReactNode;
  title: string;
  description?: string;
  relatedLinks?: Array<{ href: string; label: string }>;
}

export default function UnifiedToolHeader({
  backHref,
  backLabel = "Back",
  icon,
  title,
  description,
  relatedLinks = [],
}: UnifiedToolHeaderProps) {
  return (
    <header className="zd-tool-header">
      <div className="zd-tool-header-meta">
        <Link href={backHref} className="zd-tool-back" aria-label={backLabel}>
          <ArrowLeft size={17} />
        </Link>
      </div>

      <div className="zd-tool-title-row">
        <span className="zd-tool-title-icon">{icon}</span>
        <h1>{title}</h1>
      </div>

      {description && <p className="zd-tool-subtitle">{description}</p>}

      {relatedLinks.length > 0 && (
        <nav className="zd-tool-related" aria-label="Related tools">
          {relatedLinks.map((link, index) => (
            <span key={`${link.href}-${link.label}`} className="zd-tool-related-item">
              <Link href={link.href}>{link.label}</Link>
              {index < relatedLinks.length - 1 && <span aria-hidden="true">·</span>}
            </span>
          ))}
        </nav>
      )}
    </header>
  );
}
