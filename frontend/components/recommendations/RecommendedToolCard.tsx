import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { RegisteredTool } from "@/config/toolRegistry";

export interface RecommendedToolCardProps {
  tool: RegisteredTool;
}

export default function RecommendedToolCard({ tool }: RecommendedToolCardProps) {
  const Icon = tool.icon;

  return (
    <Link className="zd-rec-card" href={tool.href} aria-label={`Open ${tool.name}`}>
      <span className="zd-rec-icon" style={{ color: tool.iconColor }}>
        <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
      </span>
      <span className="zd-rec-body">
        <span className="zd-rec-name">{tool.name}</span>
        <span className="zd-rec-description">{tool.description}</span>
      </span>
      <ChevronRight className="zd-rec-arrow" size={18} strokeWidth={2} aria-hidden="true" />
    </Link>
  );
}
