"use client";

import { ReactNode } from "react";
import { Check, Download, X, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ToolResultPanelProps {
  filename: string;
  originalSize?: number;
  processedSize?: number;
  reductionPercent?: number;
  format?: string;
  mode?: string;
  onDownload: () => void;
  onReset: () => void;
  onShare?: () => void;
  downloadLabel?: string;
  downloadIcon?: ReactNode;
  formatBytes?: (bytes: number) => string;
  extraInfo?: ReactNode;
  shareButton?: ReactNode;
}

export default function ToolResultPanel({
  filename,
  originalSize,
  processedSize,
  reductionPercent,
  format,
  mode,
  onDownload,
  onReset,
  onShare,
  downloadLabel = "Download",
  downloadIcon,
  formatBytes,
  extraInfo,
  shareButton,
}: ToolResultPanelProps) {
  return (
    <div className="animate-scaleIn" style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "8px" }}>
      <div className="divider" style={{ borderTop: "1px solid var(--border)", marginBottom: "8px" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: 48, height: 48, borderRadius: "12px", background: "var(--teal-light)", border: "1px solid rgba(7,140,145,0.24)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-teal)", flexShrink: 0 }}>
            <Check size={24} />
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>
              Processing complete
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", fontSize: "13px", color: "var(--text-secondary)" }}>
              <span>{filename}</span>
              {format && <span>• {format}</span>}
              {mode && <span>• {mode} mode</span>}
              {originalSize && processedSize && formatBytes && (
                <span>• {formatBytes(originalSize)} → {formatBytes(processedSize)}</span>
              )}
              {reductionPercent !== undefined && (
                <span style={{ color: "var(--primary-teal)", fontWeight: 600 }}>• {reductionPercent}% reduction</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onDownload}
          className="btn-cyan"
          style={{ padding: "14px 24px", fontSize: "15px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          {downloadIcon || <Download size={20} />}
          {downloadLabel}
        </button>
      </div>

      {extraInfo && <div>{extraInfo}</div>}

      {shareButton && <div style={{ marginTop: "8px" }}>{shareButton}</div>}

      <button
        onClick={onReset}
        className="btn-ghost"
        style={{ width: "100%", padding: "14px 24px", fontSize: "15px", fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "8px" }}
      >
        <ArrowLeft size={18} />
        Process another file
      </button>
    </div>
  );
}