"use client";

import Link from "next/link";

const blogPosts = [
  {
    slug: "how-to-transfer-files-phone-to-laptop",
    title: "How to Transfer Files From Phone to Laptop Without USB",
    category: "File Sharing",
    description: "Learn the simplest way to move photos, documents, and files between your phone and laptop without cables, cloud storage, or accounts.",
  },
  {
    slug: "online-clipboard",
    title: "Online Clipboard: Copy and Paste Text Between Devices",
    category: "File Sharing",
    description: "An online clipboard lets you move copied text and files from your phone to your PC without messaging yourself.",
  },
  {
    slug: "online-clipboard-alternatives",
    title: "Online Clipboard Alternatives: Which One Should You Use?",
    category: "File Sharing",
    description: "Compare ZipDrop, Online Clipboard, Snapdrop, WeTransfer and clipboard-sync tools on files, expiry, login and editing.",
  },
  {
    slug: "share-text-files-between-devices",
    title: "How to Share Text and Files Between Devices",
    category: "File Sharing",
    description: "A practical guide to sharing text snippets and files across different devices and operating systems.",
  },
  {
    slug: "zipdrop-vs-online-clipboard",
    title: "ZipDrop vs Online Clipboard: Full Comparison",
    category: "File Sharing",
    description: "Detailed comparison of ZipDrop and Online Clipboard features, limits, and use cases.",
  },
  {
    slug: "online-clipboard-without-login",
    title: "Online Clipboard Without Login",
    category: "File Sharing",
    description: "Compare tools that let you move text and files between devices without creating an account.",
  },
  {
    slug: "share-files-between-devices",
    title: "How to Share Files Between Devices",
    category: "File Sharing",
    description: "Simple steps to share files between phones, laptops, and tablets using a 4-digit code.",
  },
  {
    slug: "free-file-transfer-online",
    title: "Free File Transfer Online: The Ultimate Guide for 2026",
    category: "File Sharing",
    description: "Find the best free file transfer online service. No registration, no software, and no hidden fees.",
  },
  {
    slug: "send-large-files-online",
    title: "Best Way to Send Large Files Online",
    category: "File Sharing",
    description: "Compare services for sending large files online without compression or quality loss.",
  },
  {
    slug: "share-files-without-login",
    title: "How to Share Files Without Login or Registration",
    category: "File Sharing",
    description: "Discover file sharing tools that work instantly without requiring an account.",
  },
  {
    slug: "snapdrop-alternative",
    title: "Best Snapdrop Alternative for Cross-Device File Sharing",
    category: "File Sharing",
    description: "Compare alternatives to Snapdrop for transferring files between devices on different networks.",
  },
  {
    slug: "wetransfer-alternative",
    title: "Best WeTransfer Alternative for Fast File Transfers",
    category: "File Sharing",
    description: "Find better alternatives to WeTransfer for sending large files quickly and without email.",
  },
];

export default function BlogPage() {
  return (
    <main className="zd-page-shell zd-blog-index" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <header style={{ marginBottom: "48px", textAlign: "center" }}>
        <h1 style={{ 
          fontSize: "clamp(30px, 4vw, 42px)", 
          fontWeight: 700, 
          lineHeight: 1.1, 
          letterSpacing: "-0.02em", 
          color: "var(--text-primary)",
          marginBottom: "16px"
        }}>
          ZipDrop Blog
        </h1>
        <p style={{ 
          fontSize: "clamp(16px, 2vw, 18px)", 
          color: "var(--text-secondary)", 
          lineHeight: 1.7,
          maxWidth: "640px",
          margin: "0 auto"
        }}>
          Guides, comparisons, and tips for sharing files, converting documents, and managing your files online.
        </p>
      </header>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", 
        gap: "24px" 
      }}>
        {blogPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            style={{
              display: "block",
              padding: "24px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              textDecoration: "none",
              color: "inherit",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(7, 140, 145, 0.35)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(32, 43, 54, 0.08)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span style={{
              display: "inline-block",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--primary-teal)",
              background: "var(--teal-light)",
              padding: "4px 10px",
              borderRadius: "99px",
              marginBottom: "12px",
            }}>
              {post.category}
            </span>
            <h2 style={{
              fontSize: "18px",
              fontWeight: 600,
              lineHeight: 1.3,
              color: "var(--text-primary)",
              margin: "0 0 10px 0",
            }}>
              {post.title}
            </h2>
            <p style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              margin: 0,
            }}>
              {post.description}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}