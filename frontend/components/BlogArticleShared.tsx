import type { ReactNode } from "react";
import Link from "next/link";
import { SITE_URL, AUTHORS } from "@/lib/site";

export type FaqItem = { q: string; a: string };

export type BlogMeta = {
  slug: string;
  title: string;
  description: string;
  published: string;
  modified: string;
  /** H2 sections to include in the BlogPosting articleSection list */
  sections: string[];
  faqs: FaqItem[];
};

export const BLOG_AUTHOR = {
  name: AUTHORS[0].name,
  url: AUTHORS[0].linkedin,
  secondAuthor: AUTHORS[1].name,
};

export function BlogPostingJsonLd({
  slug,
  title,
  description,
  datePublished,
  dateModified,
}: {
  slug: string;
  title: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
}) {
  const url = `${SITE_URL}/blog/${slug}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    author: AUTHORS.map((author) => ({
      "@type": "Person",
      name: author.name,
      url: author.linkedin,
    })),
    publisher: { "@type": "Organization", name: "ZipDrop", url: SITE_URL },
    image: `${SITE_URL}/og-image.png`,
    isPartOf: { "@type": "Blog", name: "ZipDrop Blog", url: `${SITE_URL}/blog` },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function blogMetadata(meta: BlogMeta) {
  const url = `${SITE_URL}/blog/${meta.slug}`;
  const image = { url: "/og-image.png", width: 1200, height: 630, alt: meta.title };
  return {
    title: meta.title,
    description: meta.description,
    keywords: ["file sharing", "file transfer", "zipdrop", "online tools"],
    alternates: { canonical: url },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url,
      siteName: "ZipDrop",
      type: "article" as const,
      publishedTime: meta.published,
      modifiedTime: meta.modified,
      authors: [BLOG_AUTHOR.name, BLOG_AUTHOR.secondAuthor],
      images: [image],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: meta.title,
      description: meta.description,
      images: ["/og-image.png"],
    },
  };
}

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="zd-article-faq">
      {items.map((item) => (
        <details key={item.q} open>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="zd-article-note">{children}</p>;
}

export function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="zd-article-table-wrap">
      <table className="zd-article-table">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) =>
                i === 0 ? (
                  <th key={cell} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={`${row[0]}-${i}`}>{cell}</td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AuthorBox() {
  return (
    <aside className="zd-article-author" aria-label="About the authors">
      <p>
        <strong>About the authors:</strong> {BLOG_AUTHOR.name} and{" "}
        {BLOG_AUTHOR.secondAuthor} are engineering students at DJ Sanghvi
        College of Engineering who build and maintain ZipDrop. This article
        describes features you can check directly on the{" "}
        <Link className="zd-blog-link" href="/">
          ZipDrop homepage
        </Link>
        .
      </p>
    </aside>
  );
}