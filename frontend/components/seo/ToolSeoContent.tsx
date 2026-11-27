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

export default function ToolSeoContent({ content }: ToolSeoContentProps) {
  const { name, path, howTo, features, faqs } = content;
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
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
