import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact ZipDrop – Feedback, Bug Reports & Privacy Requests",
  description:
    "Contact ZipDrop for feedback, bug reports, privacy requests, and file deletion requests. Email us at mehtaved12@gmail.com with details about your transfer.",
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  openGraph: {
    title: "Contact ZipDrop – Feedback, Bug Reports & Privacy Requests",
    description: "Contact ZipDrop for feedback, bug reports, and privacy requests.",
    url: `${SITE_URL}/contact`,
    siteName: "ZipDrop",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact ZipDrop",
    description: "Contact ZipDrop for feedback, bug reports, and privacy requests.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact ZipDrop",
  description: "Contact ZipDrop for feedback, bug reports, privacy requests, and file deletion requests.",
  url: `${SITE_URL}/contact`,
  mainEntity: {
    "@type": "Organization",
    name: "ZipDrop",
    url: SITE_URL,
    contactPoint: {
      "@type": "ContactPoint",
      email: CONTACT_EMAIL,
      contactType: "customer service",
      availableLanguage: "English",
    },
  },
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Contact", item: `${SITE_URL}/contact` },
    ],
  },
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PageShell title="Contact ZipDrop">
        <p>
          ZipDrop is run by two students, so email is the best way to reach us. Send
          a message to{" "}
          <a href={`mailto:${CONTACT_EMAIL}?subject=ZipDrop%20enquiry`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>

        <h2>Feedback and bug reports</h2>
        <p>
          Tell us what you were trying to do, what happened instead, and which
          browser and device you used. If a transfer failed, include the 4-digit
          code if you still have it.
        </p>

        <h2>Privacy and deletion requests</h2>
        <p>
          Because ZipDrop has no accounts, we need something that identifies the
          transfer: the 4-digit code or the file URL. Read the{" "}
          <a href="/privacy">Privacy Policy</a> for what we store and how long it is
          kept.
        </p>

        <h2>Misuse and removal requests</h2>
        <p>
          To report misuse or request removal of a file, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the 4-digit
          code.
        </p>

        <h2>Security issues</h2>
        <p>
          If you find a vulnerability, email us with enough detail to reproduce it,
          and give us a reasonable chance to fix it before making it public. Please
          do not access, download, or share other people&rsquo;s files while
          testing.
        </p>

        <div className="cta-row">
          <a
            className="cta"
            href={`mailto:${CONTACT_EMAIL}?subject=ZipDrop%20feedback`}
          >
            Email ZipDrop
          </a>
        </div>
      </PageShell>
    </>
  );
}
