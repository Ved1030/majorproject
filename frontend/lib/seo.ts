import { SITE_NAME, SITE_URL } from "@/lib/site";

export function canonicalUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized === "/" ? "/" : normalized.replace(/\/$/, "")}`;
}

export function absoluteUrl(path: string): string {
  return canonicalUrl(path);
}

export interface PageSeoOptions {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}

export function toolMetadata({ title, description, path, keywords = [] }: PageSeoOptions) {
  const url = canonicalUrl(path);
  return {
    title,
    description,
    keywords,
    authors: [{ name: "Ved Mehta" }, { name: "Virti Panchamia" }],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website" as const,
      locale: "en_US",
      images: ["/og-image.png"],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

interface Faq {
  question: string;
  answer: string;
}

interface SoftwareApplicationInput {
  name: string;
  path: string;
  description: string;
  applicationCategory: string;
  featureList?: string[];
}

export function softwareApplicationJsonLd({
  name,
  path,
  description,
  applicationCategory,
  featureList = [],
}: SoftwareApplicationInput) {
  const url = canonicalUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    url,
    applicationCategory,
    operatingSystem: "Web",
    inLanguage: "en",
    isAccessibleForFree: true,
    description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    creator: {
      "@type": "Organization",
      name: SITE_NAME,
      url: `${SITE_URL}/`,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: `${SITE_URL}/`,
    },
    featureList,
  };
}

export function faqPageJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function howToJsonLd(name: string, path: string, steps: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to use ${name}`,
    description: `A three-step guide to using ${name} on ZipDrop.`,
    url: canonicalUrl(path),
    inLanguage: "en",
    step: steps.map((step, index) => {
      const split = step.indexOf(" — ");
      const heading = split > 0 ? step.slice(0, split) : `Step ${index + 1}`;
      const text = split > 0 ? step.slice(split + 3) : step;
      return {
        "@type": "HowToStep",
        position: index + 1,
        name: heading,
        text,
      };
    }),
  };
}

export function breadcrumbJsonLd(path: string, labels: string[]) {
  const segments = path.split("/").filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_URL}/`,
      },
      ...segments.map((segment, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: labels[index] ?? segment.replace(/-/g, " "),
        item: canonicalUrl(`/${segments.slice(0, index + 1).join("/")}`),
      })),
    ],
  };
}
