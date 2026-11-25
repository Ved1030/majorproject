type ToolFaq = {
  question: string;
  answer: string;
};

type ToolLink = {
  label: string;
  href: string;
};

type ToolSeoSectionProps = {
  title: string;
  intro: string;
  faqs: ToolFaq[];
  links: ToolLink[];
};

export default function ToolSeoSection({
  title,
  intro,
  faqs,
  links,
}: ToolSeoSectionProps) {
  const faqPageData = {
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

  return (
    <section
      aria-labelledby="tool-seo-heading"
      style={{
        width: "100%",
        maxWidth: "960px",
        margin: "0 auto",
        padding: "clamp(32px, 5vh, 48px) 24px 0",
        color: "var(--text-primary)",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageData) }}
      />

      <h2
        id="tool-seo-heading"
        style={{
          fontSize: "clamp(24px, 3vw, 30px)",
          fontWeight: 650,
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          marginBottom: "12px",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          fontSize: "15px",
          lineHeight: 1.7,
          color: "var(--text-secondary)",
          marginBottom: "20px",
        }}
      >
        {intro}
      </p>

      <nav aria-label="Related ZipDrop tools">
        <ul
          style={{
            listStyle: "none",
            display: "flex",
            flexWrap: "wrap",
            gap: "10px 18px",
            padding: 0,
            margin: "0 0 28px",
          }}
        >
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                style={{
                  color: "var(--primary-teal)",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <h3 style={{ fontSize: "20px", fontWeight: 650, marginBottom: "14px" }}>
        Frequently Asked Questions
      </h3>

      <dl style={{ display: "flex", flexDirection: "column", gap: "16px", margin: 0 }}>
        {faqs.map((faq) => (
          <div key={faq.question}>
            <dt style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>
              {faq.question}
            </dt>
            <dd
              style={{
                fontSize: "14px",
                lineHeight: 1.7,
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              {faq.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
