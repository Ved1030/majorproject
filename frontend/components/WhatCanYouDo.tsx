"use client";

import Link from "next/link";
import { Send, RefreshCw, Archive, Eye } from "lucide-react";

const WHAT_YOU_CAN_DO = [
  {
    id: "file-sharing",
    title: "File Sharing",
    description: "Transfer files between devices using a four-digit code.",
    href: "/#share-receive",
    icon: Send,
    iconColor: "var(--primary-teal)",
    iconBg: "var(--teal-light)",
  },
  {
    id: "document-conversion",
    title: "Document Conversion",
    description: "Convert supported PDF and Office documents.",
    href: "/conversion",
    icon: RefreshCw,
    iconColor: "var(--secondary-blue)",
    iconBg: "var(--blue-light)",
  },
  {
    id: "file-compression",
    title: "File Compression",
    description: "Reduce the size of supported PDFs and images.",
    href: "/compression",
    icon: Archive,
    iconColor: "var(--orange-highlight)",
    iconBg: "var(--orange-light)",
  },
  {
    id: "background-removal",
    title: "Image Background Removal",
    description: "Remove image backgrounds and create transparent images.",
    href: "/image-tools/background-remover",
    icon: Eye,
    iconColor: "var(--purple-highlight)",
    iconBg: "var(--purple-light)",
  },
];

export default function WhatCanYouDo() {
  return (
    <section
      id="what-you-can-do"
      style={{
        width: "100%",
        maxWidth: "1280px",
        padding: "clamp(32px, 5vh, 48px) 24px 0",
        animation: "fadeInUp 0.8s 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
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
          Everything You Need to Work with Files
        </h2>
      </div>

      <div
        className="what-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "20px",
          width: "100%",
        }}
      >
        {WHAT_YOU_CAN_DO.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "block",
            }}
          >
            <div className="glass-card" style={{ padding: "28px 24px", textAlign: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  borderRadius: "14px",
                  background: item.iconBg,
                  color: item.iconColor,
                  marginBottom: "16px",
                  transition: "transform 0.2s ease",
                }}
              >
                <item.icon size={26} strokeWidth={2} aria-hidden="true" />
              </div>
              <h3
                style={{
                  fontSize: "17px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  margin: "0 0 8px 0",
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  fontSize: "13.5px",
                  fontWeight: 400,
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {item.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .what-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 560px) {
          .what-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
    </section>
  );
}