"use client";

import { ReactNode } from "react";
import { X, FileText, Image, Table, FileSpreadsheet, Presentation, File, Loader2 } from "lucide-react";

interface ToolFilePreviewProps {
  file: File | { name: string; size: number; type: string; preview?: string; width?: number; height?: number };
  index?: number;
  onRemove: () => void;
  onReplace?: () => void;
  compressing?: boolean;
  processing?: boolean;
  converting?: boolean;
  formatBytes?: (bytes: number) => string;
  showDimensions?: boolean;
  icon?: ReactNode;
}

function getFileIcon(file: File | { type: string; name: string }): ReactNode {
  const type = file.type || "";
  const name = file.name || "";
  const ext = name.split(".").pop()?.toLowerCase();

  if (type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "svg"].includes(ext || "")) {
    return <Image size={24} />;
  }
  if (type.includes("spreadsheet") || type.includes("excel") || ["xlsx", "xls", "csv"].includes(ext || "")) {
    return <Table size={24} />;
  }
  if (type.includes("presentation") || type.includes("powerpoint") || ["pptx", "ppt"].includes(ext || "")) {
    return <Presentation size={24} />;
  }
  if (type.includes("word") || type.includes("document") || ["docx", "doc", "rtf"].includes(ext || "")) {
    return <FileText size={24} />;
  }
  if (type.includes("pdf") || ext === "pdf") {
    return <FileText size={24} />;
  }
  return <File size={24} />;
}

export default function ToolFilePreview({
  file,
  index = 0,
  onRemove,
  onReplace,
  compressing = false,
  processing = false,
  converting = false,
  formatBytes,
  showDimensions = false,
  icon,
}: ToolFilePreviewProps) {
  const isBusy = compressing || processing || converting;

  const formatSize = formatBytes || ((bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  });

  const fileName = "name" in file ? file.name : "unknown";
  const fileSize = "size" in file ? file.size : 0;
  const fileType = "type" in file ? file.type : "";
  const preview = "preview" in file ? file.preview : undefined;
  const width = "width" in file ? file.width : undefined;
  const height = "height" in file ? file.height : undefined;

  return (
    <div className="animate-slideUp" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "var(--teal-light)", border: "1px solid rgba(7,140,145,0.24)", borderRadius: "12px" }}>
      {preview ? (
        <div style={{ width: 48, height: 48, borderRadius: "10px", overflow: "hidden", background: "var(--bg-card)", border: "1px solid var(--border)", flexShrink: 0 }}>
          <img src={preview} alt={fileName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : (
        <div style={{ width: 48, height: 48, borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-teal)", flexShrink: 0 }}>
          {icon || getFileIcon(file as File)}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: "0 0 4px" }}>
          {fileName}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", fontSize: "12px", color: "var(--text-secondary)" }}>
          <span>{formatSize(fileSize)}</span>
          {fileType && <span>• {fileType.split("/").pop()?.toUpperCase() || fileType}</span>}
          {showDimensions && width && height && <span>• {width}×{height}px</span>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        {onReplace && !isBusy && (
          <button
            onClick={onReplace}
            disabled={isBusy}
            className="btn-ghost"
            style={{ height: "36px", padding: "0 12px", fontSize: "12px", fontWeight: 500 }}
          >
            Replace
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          disabled={isBusy}
          style={{ padding: "8px", borderRadius: "8px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: isBusy ? "not-allowed" : "pointer", opacity: isBusy ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}