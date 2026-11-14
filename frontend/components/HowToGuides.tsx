"use client";

import Link from "next/link";
import { Smartphone, Laptop, FileText, Archive, ChevronRight } from "lucide-react";

const HOW_TO_GUIDES = [
  {
    id: "transfer-phone-laptop",
    title: "How to Transfer Files Between Your Phone and Laptop",
    description: "Learn the simplest way to move photos, documents, and files between your phone and laptop without cables, cloud storage, or accounts.",
    icon: Smartphone,
    iconColor: "var(--primary-teal)",
    iconBg: "var(--teal-light)",
    href: "/blog/how-to-transfer-files-phone-to-laptop",
    available: true,
  },
  {
    id: "pdf-to-word",
    title: "How to Convert PDF to Word Online",
    description: "Step-by-step guide to convert PDF documents to editable Word files while preserving formatting, tables, and images.",
    icon: FileText,
    iconColor: "#3189D5",
    iconBg: "var(--blue-light)",
    href: "/conversion/pdf-to-word",
    available: true,
  },
  {
    id: "compress-files",
    title: "How to Compress PDF and Image Files",
    description: "Reduce file sizes for PDFs, JPGs, PNGs, and WEBP images with adjustable quality settings for optimal balance.",
    icon: Archive,
    iconColor: "var(--orange-highlight)",
    iconBg: "var(--orange-light)",
    href: "/compression",
    available: true,
  },
];

export default function HowToGuides() {
  return (
    <section
      id="how-to-guides"
      style={{
        width: "100%",
        maxWidth: "1280px",
        padding: "clamp(32px, 5vh, 48px) 24px 0",
        animation: "fadeInUp 0.8s 0.8s cubic-bezier(0.22, 1, 0.36, 1) both",
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
          Learn How to Work with Your Files
        </h2>
        <p
          style={{
            fontSize: "clamp(15px, 1.6vw, 16px)",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
          }}
        >
          Simple guides to help you share, convert and manage files online.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "20px",
          width: "100%",
        }}
      >
        {HOW_TO_GUIDES.map((guide) => (
          <Link
            key={guide.id}
            href={guide.href}
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "block",
            }}
          >
            <div className="glass-card" style={{ padding: "28px 24px", display: "flex", flexDirection: "column", height: "100%" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 48,
                  height: 48,
                  borderRadius: "12px",
                  background: guide.iconBg,
                  color: guide.iconColor,
                  marginBottom: "16px",
                }}
              >
                <guide.icon size={24} strokeWidth={2} aria-hidden="true" />
              </div>
              <h3
                style={{
                  fontSize: "17px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  lineHeight: 1.3,
                  margin: "0 0 10px 0",
                }}
              >
                {guide.title}
              </h3>
              <p
                style={{
                  fontSize: "13.5px",
                  fontWeight: 400,
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  margin: "0 0 16px 0",
                  flex: 1,
                }}
              >
                {guide.description}
              </p>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--primary-teal)",
                }}
              >
                Read guide
                <ChevronRight size={16} strokeWidth={2.5} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .guides-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 560px) {
          .guides-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
    </section>
  );
}