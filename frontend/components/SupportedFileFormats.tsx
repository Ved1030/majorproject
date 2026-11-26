"use client";

import Link from "next/link";
import { FileText, FileType, FileSpreadsheet, Presentation, Image, Archive } from "lucide-react";

const FORMAT_GROUPS = [
  {
    id: "pdf-documents",
    title: "PDF Documents",
    description: "Portable Document Format files",
    icon: FileText,
    iconColor: "#E45B55",
    iconBg: "var(--red-light)",
    href: "/conversion?category=pdf-tools",
    extensions: ["PDF", "PDF/A"],
  },
  {
    id: "office-documents",
    title: "Office Documents",
    description: "Word processing documents",
    icon: FileType,
    iconColor: "#3189D5",
    iconBg: "var(--blue-light)",
    href: "/conversion?category=document-tools",
    extensions: ["DOCX", "DOC", "RTF", "TXT"],
  },
  {
    id: "spreadsheets",
    title: "Spreadsheets",
    description: "Excel and CSV data files",
    icon: FileSpreadsheet,
    iconColor: "#269B62",
    iconBg: "var(--green-light)",
    href: "/conversion?category=document-tools",
    extensions: ["XLSX", "XLS", "CSV"],
  },
  {
    id: "presentations",
    title: "Presentations",
    description: "PowerPoint slide decks",
    icon: Presentation,
    iconColor: "#E57940",
    iconBg: "var(--orange-light)",
    href: "/conversion?category=document-tools",
    extensions: ["PPTX", "PPT"],
  },
  {
    id: "images",
    title: "Images",
    description: "Raster and vector image formats",
    icon: Image,
    iconColor: "#9152D4",
    iconBg: "var(--purple-light)",
    href: "/conversion?category=image-tools",
    extensions: ["JPG", "PNG", "WEBP", "SVG"],
  },
  {
    id: "compression",
    title: "Compression",
    description: "Compress PDFs and images",
    icon: Archive,
    iconColor: "#647180",
    iconBg: "var(--gray-light)",
    href: "/compression",
    extensions: ["PDF", "JPG", "PNG", "WEBP"],
  },
];

export default function SupportedFileFormats() {
  return (
    <section
      id="supported-formats"
      style={{
        width: "100%",
        maxWidth: "1280px",
        padding: "clamp(32px, 5vh, 48px) 24px 0",
        animation: "fadeInUp 0.8s 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: "720px",
          margin: "0 auto clamp(32px, 5vh, 48px)",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(30px, 3.5vw, 34px)",
            fontWeight: 650,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            marginBottom: "12px",
          }}
        >
          Supported File Formats
        </h2>
        <p
          style={{
            fontSize: "clamp(15px, 1.6vw, 16px)",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
          }}
        >
          Explore the file formats supported by ZipDrop online tools.
        </p>
      </div>

      <div
        className="formats-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "20px",
          width: "100%",
        }}
      >
        {FORMAT_GROUPS.map((group) => (
          <Link
            key={group.id}
            href={group.href}
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "block",
            }}
          >
            <div className="glass-card" style={{ padding: "28px 24px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 48,
                    height: 48,
                    borderRadius: "12px",
                    background: group.iconBg,
                    color: group.iconColor,
                    flexShrink: 0,
                  }}
                >
                  <group.icon size={24} strokeWidth={2} aria-hidden="true" />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "17px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      margin: "0 0 4px 0",
                    }}
                  >
                    {group.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      margin: 0,
                    }}
                  >
                    {group.description}
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {group.extensions.map((ext) => (
                  <span
                    key={ext}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 500,
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-secondary)",
                      background: "var(--bg-main)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    .{ext.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .formats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 560px) {
          .formats-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
    </section>
  );
}