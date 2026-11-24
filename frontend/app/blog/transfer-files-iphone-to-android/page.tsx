import { SITE_URL } from "@/lib/site";
import { BlogPostingJsonLd } from "@/components/BlogArticleShared";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Transfer Files From iPhone to Android",
  description:
    "Learn how to transfer files from iPhone to Android quickly without cables, apps, or complicated setup.",
  alternates: {
    canonical: `${SITE_URL}/blog/transfer-files-iphone-to-android`,
  },
  openGraph: {
    title: "How to Transfer Files From iPhone to Android",
    description: "Learn how to transfer files from iPhone to Android quickly without cables, apps, or complicated setup.",
    url: `${SITE_URL}/blog/transfer-files-iphone-to-android`,
    siteName: "ZipDrop",
    type: "article",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "How to Transfer Files From iPhone to Android",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Transfer Files From iPhone to Android",
    description: "Learn how to transfer files from iPhone to Android quickly without cables, apps, or complicated setup.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <main className="max-w-4xl mx-auto p-8">
      <BlogPostingJsonLd slug="transfer-files-iphone-to-android" title={"How to Transfer Files From iPhone to Android"} description={"Learn how to transfer files from iPhone to Android quickly without cables, apps, or complicated setup."} />
      <h1>How to Transfer Files From iPhone to Android</h1>

      <p>
        Switching between iPhone and Android devices often creates challenges
        when transferring photos, videos, documents, and other files.
        Traditional methods usually require additional apps, cloud storage, or
        complicated setup.
      </p>

      <h2>Common File Transfer Methods</h2>

      <ul>
        <li>Messaging applications</li>
        <li>Cloud storage services</li>
        <li>Email attachments</li>
        <li>Third-party apps</li>
      </ul>

      <p>
        These methods can be slow, require accounts, or reduce file quality.
      </p>

      <h2>Use ZipDrop Instead</h2>

      <p>
        ZipDrop makes it easy to transfer files between iPhone and Android
        devices using a 4-digit code.
      </p>

      <ol>
        <li>Open ZipDrop on your iPhone.</li>
        <li>Upload your file.</li>
        <li>Receive a 4-digit code.</li>
        <li>Open ZipDrop on your Android device.</li>
        <li>Enter the code and download the file.</li>
      </ol>

      <h2>Benefits</h2>

      <ul>
        <li>No apps required</li>
        <li>No login needed</li>
        <li>Works across devices</li>
        <li>Up to 10 files per transfer</li>
      </ul>

      <p>
        ZipDrop provides a simple way to transfer files between iPhone and
        Android without unnecessary steps.
      </p>
      <div className="mt-10">
  <a
    href="/"
    className="zd-blog-cta"
  >
    Try ZipDrop Now
  </a>
</div>
    </main>
  );
}