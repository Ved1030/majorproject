"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND_DESCRIPTION, CONTACT_EMAIL } from "@/lib/site";
import ZipDropLogo from "./brand/ZipDropLogo";

const TOOL_LINKS = [
  { href: "/pdf/merge", label: "Merge & Split PDF" },
  { href: "/pdf/organize", label: "Organize PDF" },
  { href: "/compression/pdf", label: "Compress PDF" },
  { href: "/compress-pdf-under-100kb", label: "Compress PDF Under 100KB" },
  { href: "/compression/compress-image", label: "Compress Image" },
  { href: "/conversion/pdf-to-word", label: "PDF to Word" },
  { href: "/conversion", label: "Convert Files" },
  { href: "/image-tools/background-remover", label: "Background Remover" },
  { href: "/#share-receive", label: "Text Sharing" },
  { href: "/blog", label: "Blog & Guides" },
  { href: "/editor", label: "Online Editor" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Blog" },
];

const LEGAL_LINKS = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
];

const linkStyle: CSSProperties = {
  color: "var(--text-secondary)",
  fontSize: "13px",
  textDecoration: "none",
};

const headingStyle: CSSProperties = {
  color: "var(--text-primary)",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: "16px",
};

const columnStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

export default function SiteFooter() {
  const pathname = usePathname();

  if (pathname?.startsWith("/editor")) return null;

  return (
    <footer
      className="zd-site-footer"
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--bg-main)",
        marginTop: "auto",
      }}
    >
      <div
        className="zd-footer-inner"
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "48px 24px 32px",
          display: "flex",
          flexDirection: "column",
          gap: "40px",
        }}
      >
        {/* Main footer grid */}
        <div
          className="footer-grid"
          style={{
            display: "grid",
            gap: "40px",
          }}
        >
          {/* Left section - Brand */}
          <div style={{ maxWidth: "320px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <ZipDropLogo size="small" />
            </div>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.7,
                color: "var(--text-secondary)",
              }}
            >
              {BRAND_DESCRIPTION}
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=ZipDrop%20feedback`}
              style={{ ...linkStyle, display: "inline-block", marginTop: "20px", color: "var(--primary-teal)", fontWeight: 500 }}
            >
              Send feedback
            </a>
          </div>

          {/* Tools section */}
          <nav aria-label="Tools" style={columnStyle}>
            <p style={headingStyle}>Tools</p>
            {TOOL_LINKS.map((item) => (
              <Link key={item.href} href={item.href} style={linkStyle}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Company section */}
          <nav aria-label="Company" style={columnStyle}>
            <p style={headingStyle}>Company</p>
            {COMPANY_LINKS.map((item) => (
              <Link key={item.href} href={item.href} style={linkStyle}>
                {item.label}
              </Link>
            ))}
            <a href={`mailto:${CONTACT_EMAIL}?subject=ZipDrop%20feedback`} style={linkStyle}>Send Feedback</a>
          </nav>

          {/* Legal section */}
          <nav aria-label="Legal" style={columnStyle}>
            <p style={headingStyle}>Legal</p>
            {LEGAL_LINKS.map((item) => (
              <Link key={item.href} href={item.href} style={linkStyle}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom section */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "24px",
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} ZipDrop. All rights reserved.
          </p>
          <p style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=ZipDrop%20feedback`}
              style={{ ...linkStyle, fontSize: "12px" }}
            >
              Feedback
            </a>
          </p>
        </div>

        <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.6, marginTop: "8px" }}>
          ZipDrop is an independent project and is not affiliated with Apple,
          Google, Microsoft, Snapdrop, or WeTransfer.
        </p>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 560px) {
          .footer-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
    </footer>
  );
}