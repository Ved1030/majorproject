import { SITE_URL } from "@/lib/site";
import { BlogPostingJsonLd } from "@/components/BlogArticleShared";

export const metadata = {
  title: "Best AirDrop Alternative",
  description:
    "Looking for an AirDrop alternative? ZipDrop works in any browser: upload up to 10 files and share a 4-digit code.",
  alternates: {
    canonical: `${SITE_URL}/blog/airdrop-alternative`,
  },
  openGraph: {
    title: "Best AirDrop Alternative",
    description: "Looking for an AirDrop alternative? ZipDrop works in any browser: upload up to 10 files and share a 4-digit code.",
    url: `${SITE_URL}/blog/airdrop-alternative`,
    siteName: "ZipDrop",
    type: "article",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Best AirDrop Alternative",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best AirDrop Alternative",
    description: "Looking for an AirDrop alternative? ZipDrop works in any browser: upload up to 10 files and share a 4-digit code.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <main className="max-w-4xl mx-auto p-8">
      <BlogPostingJsonLd slug="airdrop-alternative" title={"Best AirDrop Alternative"} description={"Looking for an AirDrop alternative? ZipDrop works in any browser: upload up to 10 files and share a 4-digit code."} />
      <h1>Best AirDrop Alternative in 2026</h1>

      <p>
        Looking for an AirDrop alternative?
        ZipDrop lets you send files between devices
        using a simple 4-digit code, with no app to install.
      </p>

      <h2>Why Use ZipDrop?</h2>

      <ul>
        <li>No login required</li>
        <li>Works on any device with a browser</li>
        <li>Up to 10 files per transfer</li>
        <li>Files keep their original quality</li>
      </ul>

      <p>
        <a href="/">
          Try ZipDrop Now →
        </a>
      </p>
    </main>
  );
}