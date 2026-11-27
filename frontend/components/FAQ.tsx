"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { HOME_FAQS, faqAnswerText, type FaqSegment } from "@/data/homeFaq";
import { faqPageJsonLd } from "@/lib/seo";
import styles from "./FAQ.module.css";

const FAQ_SCHEMA = faqPageJsonLd(
  HOME_FAQS.map((item) => ({
    question: item.question,
    answer: faqAnswerText(item.answer),
  })),
);

const FAQ_SCHEMA_JSON = JSON.stringify(FAQ_SCHEMA).replace(/</g, "\\u003c");

function Answer({ segments }: { segments: FaqSegment[] }) {
  return (
    <p className={styles.answerText}>
      {segments.map((segment, index) =>
        segment.type === "link" ? (
          <Link key={index} href={segment.href} className={styles.answerLink}>
            {segment.text}
          </Link>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </p>
  );
}

export default function FAQ() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section id="faq" className={styles.section} aria-labelledby="faq-heading">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: FAQ_SCHEMA_JSON }}
      />

      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>HELP &amp; SUPPORT</p>
          <h2 id="faq-heading" className={styles.title}>
            Frequently Asked Questions
          </h2>
          <p className={styles.subtitle}>
            Everything you need to know about sharing, converting, compressing and
            managing your files with ZipDrop.
          </p>
        </div>

        <div className={styles.list}>
          {HOME_FAQS.map((item) => {
            const isOpen = openId === item.id;

            return (
              <article
                key={item.id}
                className={`${styles.item} ${isOpen ? styles.itemOpen : ""}`}
              >
                <h3 className={styles.question}>
                  <button
                    type="button"
                    className={styles.trigger}
                    id={`faq-question-${item.id}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${item.id}`}
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                  >
                    <span className={styles.questionText}>{item.question}</span>
                    <span className={styles.icon} aria-hidden="true">
                      {isOpen ? (
                        <Minus size={18} strokeWidth={2.4} />
                      ) : (
                        <Plus size={18} strokeWidth={2.4} />
                      )}
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-answer-${item.id}`}
                  role="region"
                  aria-labelledby={`faq-question-${item.id}`}
                  className={styles.answer}
                  hidden={!isOpen}
                >
                  <div className={styles.answerInner}>
                    <Answer segments={item.answer} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className={styles.support}>
          <p className={styles.supportText}>Still have questions? We&apos;re here to help.</p>
          <Link href="/contact" className={styles.supportLink}>
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}
