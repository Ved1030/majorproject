import { SITE_URL } from "@/lib/site";
import { BlogPostingJsonLd } from "@/components/BlogArticleShared";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Send Photos From Phone to Laptop",
  description:
    "Learn how to transfer photos from your phone to your laptop quickly without cables or extra software.",
  alternates: {
    canonical: `${SITE_URL}/blog/send-photos-from-phone-to-laptop`,
  },
  openGraph: {
    title: "How to Send Photos From Phone to Laptop",
    description: "Learn how to transfer photos from your phone to your laptop quickly without cables or extra software.",
    url: `${SITE_URL}/blog/send-photos-from-phone-to-laptop`,
    siteName: "ZipDrop",
    type: "article",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "How to Send Photos From Phone to Laptop",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Send Photos From Phone to Laptop",
    description: "Learn how to transfer photos from your phone to your laptop quickly without cables or extra software.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <main className="max-w-4xl mx-auto p-8">
      <BlogPostingJsonLd slug="send-photos-from-phone-to-laptop" title={"How to Send Photos From Phone to Laptop"} description={"Learn how to transfer photos from your phone to your laptop quickly without cables or extra software."} />
      <h1>How to Send Photos From Phone to Laptop</h1>

      <p>
        Whether you're backing up memories, sharing work, or moving screenshots,
        sending photos from your phone to your laptop should be quick and easy.
      </p>

      <h2>Traditional Methods</h2>

      <ul>
        <li>USB cables</li>
        <li>Email attachments</li>
        <li>Cloud storage services</li>
        <li>Messaging apps</li>
      </ul>

      <p>
        These methods often require extra setup, accounts, or can reduce image
        quality.
      </p>

      <h2>How ZipDrop Works</h2>

      <ol>
        <li>Open ZipDrop on your phone.</li>
        <li>Select and upload your photos.</li>
        <li>Receive a 4-digit code.</li>
        <li>Open ZipDrop on your laptop.</li>
        <li>Enter the code and download your photos.</li>
      </ol>

      <h2>Why Use ZipDrop?</h2>

      <ul>
        <li>No cables required</li>
        <li>No account creation</li>
        <li>Works on any device</li>
        <li>Photos keep their original quality</li>
      </ul>

      <p>
        ZipDrop helps you transfer photos from your phone to your laptop without
        cables or extra software.
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