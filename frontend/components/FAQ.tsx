"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export const FAQ_ITEMS = [
  {
    id: "what-is-zipdrop",
    question: "What is ZipDrop?",
    answer: "ZipDrop is a browser-based platform for sharing files and text between devices with a four-digit code. It also includes online file conversion, PDF and image compression, background removal, and document editing. No account or app install is required.",
  },
  {
    id: "official-zipdrop-site",
    question: "Is www.getzipdrop.com the official ZipDrop site?",
    answer: "Yes. www.getzipdrop.com is the official ZipDrop site. Use it to share files and text between devices, compress PDFs and images, convert files, remove backgrounds and edit documents.",
  },
  {
    id: "transfer-file-limit",
    question: "How many files can I share in one ZipDrop transfer?",
    answer: "You can upload up to 10 files per transfer. The sending and receiving devices do not need to be on the same Wi-Fi network.",
  },
  {
    id: "official-pdf-to-word",
    question: "Where can I convert PDF to Word with ZipDrop?",
    answer: "Use the official PDF to Word converter at https://www.getzipdrop.com/conversion/pdf-to-word. Upload a PDF, choose Editable or Visual Fidelity mode, and download the DOCX.",
  },
  {
    id: "zipdrop-file-compression",
    question: "Which file compression tools does ZipDrop offer?",
    answer: "ZipDrop offers free online compression for PDF, JPG, PNG and WEBP files at https://www.getzipdrop.com/compression. Upload a file, choose a compression level and download the result without an account.",
  },
  {
    id: "transfer-between-devices",
    question: "How can I share files between devices?",
    answer: "Open ZipDrop on the sending device, add files or text, and you will receive a four-digit code. On the receiving device, open ZipDrop and enter the code to download the files. The devices do not need to be on the same Wi-Fi network.",
  },
  {
    id: "requires-registration",
    question: "Does ZipDrop require registration?",
    answer: "No. The available sharing, conversion, compression, background-removal, and editing tools can be used without sign-up, login, or account creation.",
  },
  {
    id: "is-zipdrop-free",
    question: "Is ZipDrop free?",
    answer: "Yes. The available tools can be used without payment or an account.",
  },
  {
    id: "app-install",
    question: "Do I need to install an app?",
    answer: "No. ZipDrop runs in a modern web browser on supported phones, tablets, and computers.",
  },
  {
    id: "convert-pdf-to-word",
    question: "How do I convert PDF to Word online?",
    answer: "Open the PDF to Word tool, upload a PDF, choose Editable or Visual Fidelity mode, and download the DOCX. Editable mode reconstructs text and tables as editable content; Visual Fidelity mode preserves the page appearance.",
  },
  {
    id: "compress-pdf",
    question: "Can I compress PDF files using ZipDrop?",
    answer: "Yes. The Compress PDF tool offers three compression levels. The PDF is uploaded to ZipDrop's server, compressed, and returned for download.",
  },
  {
    id: "supported-image-formats",
    question: "Which image formats does ZipDrop support?",
    answer: "Conversion supports JPG, PNG, WEBP, and SVG inputs. Image compression supports JPG, PNG, and WEBP. Background removal accepts JPG, PNG, and WEBP files.",
  },
  {
    id: "background-remover",
    question: "Can I remove an image background online?",
    answer: "Yes. The Background Remover detects and removes backgrounds from JPG, PNG, and WEBP images, and lets you download the result with a transparent background.",
  },
  {
    id: "file-handling",
    question: "How does ZipDrop handle uploaded files?",
    answer: "Files uploaded for sharing are stored on ZipDrop's servers so the recipient can download them with the code. A 48-hour expiry is recorded, but automatic deletion is not currently enforced. Files are not end-to-end encrypted, so avoid sharing sensitive documents.",
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
      >
        {FAQ_ITEMS.map((item) => {
          const isOpen = openItems.includes(item.id);
          return (
            <details
              key={item.id}
              id={item.id}
              open={isOpen}
              onToggle={() => toggleItem(item.id)}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >
              <summary
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
                style={{
                  padding: "0 24px 20px",
                  fontSize: "14px",
                  lineHeight: 1.7,
                  color: "var(--text-secondary)",
                  animation: "fadeIn 0.2s ease",
                }}
              >
                <p style={{ margin: 0 }}>{item.answer}</p>
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