"use client";

import { ReactNode, createElement } from "react";
import { Info, AlertTriangle, Shield, Lightbulb, FileText } from "lucide-react";

interface InstructionSection {
  title: string;
  icon?: ReactNode;
  items: ReactNode[];
  variant?: "default" | "warning" | "info" | "tip";
}

interface ToolInstructionsProps {
  sections: InstructionSection[];
  className?: string;
}

const sectionStyles: Record<string, { bg: string; border: string; iconColor: string; titleColor: string }> = {
  default: {
    bg: "var(--bg-card)",
    border: "var(--border)",
    iconColor: "var(--primary-teal)",
    titleColor: "var(--text-primary)",
  },
  warning: {
    bg: "var(--warning-light)",
    border: "rgba(217,147,8,0.20)",
    iconColor: "var(--warning)",
    titleColor: "var(--text-primary)",
  },
  info: {
    bg: "var(--editor-workspace)",
    border: "var(--border)",
    iconColor: "var(--primary-teal)",
    titleColor: "var(--text-primary)",
  },
  tip: {
    bg: "var(--teal-light)",
    border: "rgba(7,140,145,0.24)",
    iconColor: "var(--primary-teal)",
    titleColor: "var(--text-primary)",
  },
};

const defaultIcons: Record<string, ReactNode> = {
  default: <Info size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Shield size={18} />,
  tip: <Lightbulb size={18} />,
};

export function parseFormattedText(text: string): ReactNode {
  const parts = text.split(/(<\/?strong>|<\/?b>|<\/?em>|<\/?i>)/g).filter(Boolean);
  const elements: ReactNode[] = [];
  let isBold = false;
  let isItalic = false;

  for (const part of parts) {
    if (part === "<strong>" || part === "<b>") {
      isBold = true;
    } else if (part === "</strong>" || part === "</b>") {
      isBold = false;
    } else if (part === "<em>" || part === "<i>") {
      isItalic = true;
    } else if (part === "</em>" || part === "</i>") {
      isItalic = false;
    } else {
      const style: React.CSSProperties = {
        fontSize: "13px",
        lineHeight: 1.7,
        color: "var(--text-secondary)",
      };
      if (isBold) style.fontWeight = 600;
      if (isItalic) style.fontStyle = "italic";
      elements.push(<span style={style} key={elements.length}>{part}</span>);
    }
  }
  return elements;
}

function renderItemContent(item: ReactNode): ReactNode {
  if (typeof item === "string") {
    if (item.includes("<strong>") || item.includes("<b>") || item.includes("<em>") || item.includes("<i>")) {
      return parseFormattedText(item);
    }
    return <span style={{ fontSize: "13px", lineHeight: 1.7, color: "var(--text-secondary)" }}>{item}</span>;
  }
  return item;
}

export default function ToolInstructions({ sections, className = "" }: ToolInstructionsProps) {
  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {sections.map((section, index) => {
        const variant = section.variant || "default";
        const styles = sectionStyles[variant];
        const icon = section.icon || defaultIcons[variant] || defaultIcons.default;

        return (
          <div
            key={index}
            style={{
              padding: "20px",
              background: styles.bg,
              border: `1px solid ${styles.border}`,
              borderRadius: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: styles.iconColor + "15",
                  color: styles.iconColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: "15px", fontWeight: 650, color: styles.titleColor, margin: "0 0 8px" }}>
                  {section.title}
                </h3>
                <ul style={{ margin: 0, paddingLeft: "0", listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <span style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: "2px" }}>•</span>
                      <span style={{ flex: 1 }}>{renderItemContent(item)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}