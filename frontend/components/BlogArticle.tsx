"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { 
  blogMetadata, 
  Faq, 
  Note, 
  Table, 
  AuthorBox, 
  BLOG_AUTHOR,
  type BlogMeta,
  type FaqItem 
} from "./BlogArticleShared";
import styles from "./BlogArticle.module.css";

export { blogMetadata, Faq, Note, Table, AuthorBox, BLOG_AUTHOR, type BlogMeta, type FaqItem };

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function getIntroText(intro: ReactNode): string {
  if (typeof intro === "string") return intro;
  if (Array.isArray(intro)) {
    return intro.filter(c => typeof c === "string").join("");
  }
  if (intro && typeof intro === "object" && "props" in intro) {
    const element = intro as React.ReactElement<any>;
    if (element.props?.children) {
      return getIntroText(element.props.children);
    }
  }
  return "";
}

type Props = {
  meta: BlogMeta;
  h1: string;
  intro: ReactNode;
  children: ReactNode;
  related: { href: string; label: string }[];
};

export default function BlogArticle({ meta, h1, intro, children, related }: Props) {
  const url = `${SITE_URL}/blog/${meta.slug}`;
  const [activeTocId, setActiveTocId] = useState<string>("");
  const [readingTime, setReadingTime] = useState<number>(0);
  const [isClient, setIsClient] = useState(false);

  // Build TOC items from meta.sections
  const tocItems = meta.sections.map((section) => ({
    id: slugify(section),
    text: section,
    level: 2,
  }));

  // Calculate reading time on client
  useEffect(() => {
    setIsClient(true);
    const introText = getIntroText(intro);
    const wordsPerMinute = 200;
    // Rough estimate: intro + sections * average words per section
    const estimatedWords = introText.trim().split(/\s+/).length + meta.sections.length * 80;
    setReadingTime(Math.ceil(estimatedWords / wordsPerMinute));
  }, [intro, meta.sections]);

  // IntersectionObserver for active TOC item
  useEffect(() => {
    if (!isClient) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTocId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -80% 0px", threshold: 0 }
    );

    tocItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [tocItems, isClient]);

  // Ensure headings in content have IDs matching TOC
  useEffect(() => {
    if (!isClient) return;
    tocItems.forEach((item) => {
      const headings = document.querySelectorAll(`h2, h3`);
      headings.forEach((heading) => {
        if (heading.textContent?.trim().toLowerCase() === item.text.toLowerCase()) {
          heading.id = item.id;
        }
      });
    });
  }, [tocItems, isClient]);

  const article = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: meta.title,
    description: meta.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: meta.published,
    dateModified: meta.modified,
    inLanguage: "en",
    articleSection: meta.sections,
    author: [
      { "@type": "Person", name: BLOG_AUTHOR.name, url: BLOG_AUTHOR.url },
      { "@type": "Person", name: BLOG_AUTHOR.secondAuthor },
    ],
    publisher: { "@type": "Organization", name: "ZipDrop", url: SITE_URL },
    image: `${SITE_URL}/og-image.png`,
    isPartOf: { "@type": "Blog", name: "ZipDrop Blog", url: `${SITE_URL}/blog` },
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: h1, item: url },
    ],
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: meta.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main className={styles.article}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />

      <article className={styles.content}>
        <header>
          <h1>{h1}</h1>
          <p className={styles.meta}>
            <span className={styles.metaItem}>
              By {BLOG_AUTHOR.name} and {BLOG_AUTHOR.secondAuthor}
            </span>
            <span aria-hidden="true"> · </span>
            <time dateTime={meta.published} className={styles.metaItem}>
              Published {meta.published}
            </time>
            {meta.modified !== meta.published && (
              <>
                <span aria-hidden="true"> · </span>
                <time dateTime={meta.modified} className={styles.metaItem}>
                  Updated {meta.modified}
                </time>
              </>
            )}
            {readingTime > 0 && (
              <>
                <span aria-hidden="true"> · </span>
                <span className={styles.metaItem}>
                  {readingTime} min read
                </span>
              </>
            )}
          </p>
        </header>

        <p className={styles.lede}>{intro}</p>

        <div id="article-content">{children}</div>

        {meta.faqs.length > 0 && (
          <>
            <h2 id="faq">Frequently asked questions</h2>
            <Faq items={meta.faqs} />
          </>
        )}

        <AuthorBox />

        <Link className={`zd-blog-cta ${styles.cta}`} href="/#share-receive">
          Try ZipDrop free — no account needed
        </Link>

        {related.length > 0 && (
          <>
            <h2 id="related">Related reading</h2>
            <ul className={styles.related}>
              {related.map((r) => (
                <li key={r.href}>
                  <a className="zd-blog-link" href={r.href}>
                    {r.label}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </article>

      <aside className={styles.sidebar} aria-label="Article sidebar">
        {tocItems.length > 0 && (
          <nav className={styles.sidebarToc} aria-label="Table of contents">
            <h3>On this page</h3>
            <ul>
              {tocItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={activeTocId === item.id ? "active" : ""}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className={styles.sidebarCta}>
          <h3>Transfer Files Between Your Devices with ZipDrop</h3>
          <p>
            Upload your files, get a four-digit code and retrieve them on another device without creating an account.
          </p>
          <Link className="zd-blog-cta" href="/#share-receive" style={{ display: "inline-block" }}>
            Try ZipDrop Now
          </Link>
        </div>

        {related.length > 0 && (
          <div className={styles.sidebarRelated}>
            <h3>Related articles</h3>
            <ul>
              {related.slice(0, 3).map((r) => (
                <li key={r.href}>
                  <a href={r.href}>
                    <p className={styles.sidebarRelatedTitle}>{r.label}</p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </main>
  );
}