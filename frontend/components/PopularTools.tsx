"use client";

import Link from "next/link";
import {
  FileText,
  FileType,
  Archive,
  Image,
  FileImage,
  FileSpreadsheet,
  FileCode,
  Scissors,
  Zap,
  Eye,
} from "lucide-react";

const POPULAR_TOOLS = [
  {
    id: "pdf-to-word",
    name: "PDF to Word",
    description: "Convert PDF to editable DOCX with Editable or Visual Fidelity mode",
    href: "/conversion/pdf-to-word",
    icon: FileText,
    iconColor: "#3189D5",
    iconBg: "var(--blue-light)",
  },
  {
    id: "word-to-pdf",
    name: "Word to PDF",
    description: "Convert DOCX/DOC to PDF preserving formatting",
    href: "/conversion/word-to-pdf",
    icon: FileType,
    iconColor: "#E45B55",
    iconBg: "var(--red-light)",
  },
  {
    id: "compress-pdf",
    name: "Compress PDF",
    description: "Reduce PDF size with Low, Recommended or High compression",
    href: "/compression/pdf",
    icon: Archive,
    iconColor: "#E45B55",
    iconBg: "var(--red-light)",
  },
  {
    id: "compress-jpg",
    name: "Compress JPG",
    description: "Reduce JPG file size with quality control",
    href: "/compression/jpg",
    icon: Zap,
    iconColor: "#9152D4",
    iconBg: "var(--purple-light)",
  },
  {
    id: "png-to-jpg",
    name: "PNG to JPG",
    description: "Convert PNG images to JPG with adjustable quality",
    href: "/conversion/png-to-jpg",
    icon: FileImage,
    iconColor: "#07999A",
    iconBg: "var(--teal-light)",
  },
  {
    id: "pdf-to-jpg",
    name: "PDF to JPG",
    description: "Rasterize PDF pages to high-quality JPG images",
    href: "/conversion/pdf-to-jpg",
    icon: FileImage,
    iconColor: "#9152D4",
    iconBg: "var(--purple-light)",
  },
  {
    id: "jpg-to-pdf",
    name: "JPG to PDF",
    description: "Convert JPG images to PDF documents",
    href: "/conversion/jpg-to-pdf",
    icon: FileImage,
    iconColor: "#E45B55",
    iconBg: "var(--red-light)",
  },
  {
    id: "images-to-pdf",
    name: "Images to PDF",
    description: "Combine multiple images into a single PDF",
    href: "/conversion/images-to-pdf",
    icon: FileSpreadsheet,
    iconColor: "#E45B55",
    iconBg: "var(--red-light)",
  },
  {
    id: "remove-background",
    name: "Background Remover",
    description: "Remove JPG, PNG or WEBP backgrounds to a transparent PNG",
    href: "/image-tools/background-remover",
    icon: Eye,
    iconColor: "#9152D4",
    iconBg: "var(--purple-light)",
  },
];

export default function PopularTools() {
  return (
    <section
      id="popular-tools"
      style={{
        width: "100%",
        maxWidth: "1280px",
        padding: "clamp(32px, 5vh, 48px) 24px 0",
        animation: "fadeInUp 0.8s 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
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
          Popular Online File Tools
        </h2>
        <p
          style={{
            fontSize: "clamp(15px, 1.6vw, 16px)",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
          }}
        >
          Use the official ZipDrop tools at www.getzipdrop.com to convert files, compress PDFs and images, share files, and remove backgrounds — no account required.
        </p>
      </div>

      <div className="tools-grid">
        {POPULAR_TOOLS.map((tool) => (
          <Link
            key={tool.id}
            href={tool.href}
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "block",
            }}
          >
            <div className="tool-category-card-new">
              <div className="tool-category-icon-new" style={{ color: tool.iconColor }}>
                <tool.icon size={26} strokeWidth={2} aria-hidden="true" />
              </div>
              <h3 className="tool-category-title-new">{tool.name}</h3>
              <p className="tool-category-desc-new">{tool.description}</p>
              <div className="tool-category-arrow-new">
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 20,
                    height: 20,
                    color: "var(--primary-teal)",
                    transition: "transform 200ms ease, color 200ms ease",
                    opacity: 0.6,
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}