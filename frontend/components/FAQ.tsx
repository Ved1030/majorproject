"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export const FAQ_ITEMS = [
  {
    id: "what-is-zipdrop",
    question: "What is ZipDrop?",
    answer: "ZipDrop is a free, browser-based file utility platform. It lets you share files between devices using a 4-digit code, convert documents and images, compress PDFs and images, remove image backgrounds, and edit documents online — all without registration or software installation.",
  },
  {
    id: "transfer-between-devices",
    question: "How can I transfer files between devices?",
    answer: "Open ZipDrop on the sending device, select your files, and you'll receive a 4-digit code. On the receiving device, open ZipDrop and enter that code. The files will be ready to download. No accounts, no cables, no cloud storage links needed.",
  },
  {
    id: "requires-registration",
    question: "Does ZipDrop require registration?",
    answer: "No. ZipDrop works without any sign-up, login, or account creation. All features — file sharing, conversion, compression, background removal, and editing — are available immediately.",
  },
  {
    id: "convert-pdf-to-word",
    question: "How do I convert PDF to Word online?",
    answer: "Go to the PDF to Word tool, upload your PDF file, and start the conversion. ZipDrop preserves layout, tables, and formatting. The converted DOCX file downloads automatically when ready.",
  },
  {
    id: "compress-pdf",
    question: "Can I compress PDF files using ZipDrop?",
    answer: "Yes. The Compress PDF tool offers three compression levels. Upload your PDF, choose a level, and download the smaller file. The tool works entirely in your browser.",
  },
  {
    id: "supported-image-formats",
    question: "Which image formats does ZipDrop support?",
    answer: "ZipDrop supports JPG, PNG, WEBP, and SVG for conversion, compression, and background removal. You can also combine multiple images into a single PDF.",
  },
  {
    id: "background-remover",
    question: "Can I remove an image background online?",
    answer: "Yes. The Background Remover tool automatically detects and removes backgrounds from images. Upload a JPG, PNG, or WEBP file and download the result with a transparent background.",
  },
  {
    id: "file-handling",
    question: "How does ZipDrop handle uploaded files?",
    answer: "Files you upload for sharing are stored on our servers until the recipient downloads them using the 4-digit code. Files for conversion and compression are processed and returned directly. We do not scan, analyze, or use your files for any purpose other than delivering the requested service.",
  },
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section
      id="faq"
      style={{
        width: "100%",
        maxWidth: "1280px",
        padding: "clamp(32px, 5vh, 48px) 24px 0",
        animation: "fadeInUp 0.8s 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
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
          Frequently Asked Questions
        </h2>
      </div>

      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
        itemScope
        itemType="https://schema.org/FAQPage"
      >
        {FAQ_ITEMS.map((item) => {
          const isOpen = openItems.includes(item.id);
          return (
            <details
              key={item.id}
              id={item.id}
              open={isOpen}
              onToggle={() => toggleItem(item.id)}
              itemProp="mainEntity"
              itemScope
              itemType="https://schema.org/Question"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >
              <summary
                itemProp="name"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 24px",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  listStyle: "none",
                  userSelect: "none",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleItem(item.id);
                  }
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                  <HelpCircle
                    size={18}
                    strokeWidth={2}
                    style={{ color: "var(--primary-teal)", flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  {item.question}
                </span>
                <ChevronDown
                  size={18}
                  strokeWidth={2.5}
                  style={{
                    color: "var(--text-muted)",
                    flexShrink: 0,
                    transition: "transform 0.2s ease",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                  aria-hidden="true"
                />
              </summary>
              <div
                itemProp="acceptedAnswer"
                itemScope
                itemType="https://schema.org/Answer"
                style={{
                  padding: "0 24px 20px",
                  fontSize: "14px",
                  lineHeight: 1.7,
                  color: "var(--text-secondary)",
                  animation: "fadeIn 0.2s ease",
                }}
              >
                <p itemProp="text" style={{ margin: 0 }}>{item.answer}</p>
              </div>
            </details>
          );
        })}
      </div>

      <style jsx>{`
        details summary::-webkit-details-marker {
          display: none;
        }
        details summary:focus-visible {
          outline: 2px solid var(--primary-teal);
          outline-offset: -2px;
          border-radius: 12px;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}