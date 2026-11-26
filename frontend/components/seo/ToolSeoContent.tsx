import AdSlot from "@/components/seo/AdSlot";
import RelatedTools from "@/components/seo/RelatedTools";
import type { ToolSeoContent as ToolSeoContentData } from "@/data/toolSeoContent";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  howToJsonLd,
  softwareApplicationJsonLd,
} from "@/lib/seo";

export interface ToolSeoContentProps {
  content: ToolSeoContentData;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function ToolSeoContent({ content }: ToolSeoContentProps) {
  const { name, path, howTo, features, privacy, faqs, links } = content;
  const prefix = slugify(path || "home") || "home";
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      softwareApplicationJsonLd({
        name,
        path,
        description: content.intro,
        applicationCategory: content.applicationCategory,
        featureList: features,
      }),
      faqPageJsonLd(faqs),
      howToJsonLd(name, path, howTo),
      breadcrumbJsonLd(path, [content.category, name]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div style={{ width: "100%", maxWidth: "960px", margin: "24px auto 0", padding: "0 24px" }}>
        <AdSlot slotId={`${prefix}-top`} format="auto" />
      </div>

      <section
        aria-labelledby={`${prefix}-how-to-heading`}
        style={{
          width: "100%",
          maxWidth: "960px",
          margin: "40px auto 0",
          padding: "0 24px",
        }}
      >
        <h2
          id={`${prefix}-how-to-heading`}
          style={{
            fontSize: "clamp(22px, 3vw, 28px)",
            fontWeight: 650,
            lineHeight: 1.25,
            color: "var(--text-primary)",
            marginBottom: "12px",
          }}
        >
          How to use {name} in 3 steps
        </h2>
        <p
          style={{
            fontSize: "15px",
            lineHeight: 1.7,
            color: "var(--text-secondary)",
            marginBottom: "20px",
          }}
        >
          {content.intro}
        </p>

        <ol
          style={{
            listStyle: "none",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
            margin: 0,
            padding: 0,
          }}
        >
          {howTo.map((step, index) => {
            const split = step.indexOf(" — ");
            const heading = split > 0 ? step.slice(0, split) : `Step ${index + 1}`;
            const text = split > 0 ? step.slice(split + 3) : step;
            return (
              <li
                key={heading}
                style={{
                  padding: "18px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "var(--teal-light)",
                    color: "var(--primary-teal)",
                    fontSize: "13px",
                    fontWeight: 700,
                    marginBottom: "10px",
                  }}
                >
                  {index + 1}
                </span>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 650,
                    color: "var(--text-primary)",
                    marginBottom: "6px",
                  }}
                >
                  {heading}
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.65,
                    color: "var(--text-secondary)",
                    margin: 0,
                  }}
                >
                  {text}
                </p>
              </li>
            );
          })}
        </ol>

        <div
          style={{
            marginTop: "24px",
            padding: "20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 650,
              color: "var(--text-primary)",
              marginBottom: "12px",
            }}
          >
            Key features and privacy
          </h3>
          <ul
            style={{
              margin: "0 0 12px",
              paddingLeft: "20px",
              fontSize: "14px",
              lineHeight: 1.8,
              color: "var(--text-secondary)",
            }}
          >
            {features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <p
            style={{
              fontSize: "13px",
              lineHeight: 1.7,
              color: "var(--text-muted)",
              margin: 0,
            }}
          >
            <strong>Privacy:</strong> {privacy}
          </p>
        </div>
      </section>

      <div style={{ width: "100%", maxWidth: "960px", margin: "0 auto", padding: "0 24px" }}>
        <AdSlot slotId={`${prefix}-in-content`} format="auto" />
      </div>

      <section
        aria-labelledby={`${prefix}-faq-heading`}
        style={{
          width: "100%",
          maxWidth: "960px",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <h2
          id={`${prefix}-faq-heading`}
          style={{
            fontSize: "clamp(22px, 3vw, 28px)",
            fontWeight: 650,
            color: "var(--text-primary)",
            marginBottom: "16px",
          }}
        >
          Frequently Asked Questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {faqs.map((faq) => (
            <details
              key={faq.question}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "16px 20px",
              }}
            >
              <summary
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  cursor: "pointer",
                }}
              >
                {faq.question}
              </summary>
              <p
                style={{
                  fontSize: "14px",
                  lineHeight: 1.7,
                  color: "var(--text-secondary)",
                  margin: "12px 0 0",
                }}
              >
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <RelatedTools links={links} />

      <div style={{ width: "100%", maxWidth: "960px", margin: "24px auto 0", padding: "0 24px" }}>
        <AdSlot slotId={`${prefix}-related`} format="horizontal" />
      </div>
    </>
  );
}
