"use client";

import { ReactNode } from "react";
import { Lightbulb, Shield } from "lucide-react";
import { parseFormattedText } from "./ToolInstructions";

interface ToolInfoBlockProps {
  title: string;
  items: ReactNode[];
  variant?: "notes" | "privacy";
  icon?: ReactNode;
}

export default function ToolInfoBlock({
  title,
  items,
  variant = "notes",
  icon,
}: ToolInfoBlockProps) {
  const isPrivacy = variant === "privacy";

  return (
    <section className={`zd-tool-info-block ${isPrivacy ? "zd-tool-info-block--privacy" : "zd-tool-info-block--notes"}`}>
      <div className="zd-tool-info-heading">
        <span className="zd-tool-info-icon">
          {icon ?? (isPrivacy ? <Shield size={16} /> : <Lightbulb size={16} />)}
        </span>
        <h3>{title}</h3>
      </div>
      <ul className="zd-tool-info-list">
        {items.map((item, index) => (
          <li key={index}>
            {typeof item === "string" && /<\/?(strong|b|em|i)>/.test(item)
              ? parseFormattedText(item)
              : item}
          </li>
        ))}
      </ul>
    </section>
  );
}
