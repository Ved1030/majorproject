"use client";

import { useState, useCallback, useRef } from "react";
import {
  ArrowLeft,
  FileText,
  Download,
  Check,
  X,
  Loader2,
  AlertCircle,
  GripHorizontal,
  Plus,
} from "lucide-react";
import Navbar from "../../../components/Navbar";
import UnifiedToolPage from "../../../components/tool/UnifiedToolPage";
import UnifiedToolHeader from "../../../components/tool/UnifiedToolHeader";
import ToolActionButton from "../../../components/tool/ToolActionButton";
import { mergePdf } from "../../../utils/api";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.getzipdrop.com";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB (existing PDF limit)
const MAX_FILE_COUNT = 10;

const breadcrumbItems = [
  { name: "PDF Tools", href: "/conversion" },
  { name: "Merge PDF", href: "/pdf/merge" },
];

interface MergeResult {
  blob: Blob;
  filename: string;
  stats: {
    inputFiles: number;
    pageCount: number;
    originalTotalSize: number;
    outputSize: number;
  };
}

export default function MergePdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MergeResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  const validateFile = (f: File) => {
    const isPdf =
      f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return "Unsupported format. Only PDF files are allowed.";
    }
    if (f.size === 0) {
      return "Empty file uploaded.";
    }
    if (f.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`;
    }
    return null;
  };

  const addIncomingFiles = useCallback((incoming: File[]) => {
    setError(null);
    const valid: File[] = [];
    const invalid: string[] = [];
    for (const f of incoming) {
      const err = validateFile(f);
      if (err) {
        invalid.push(`${f.name}: ${err}`);
      } else {
        valid.push(f);
      }
    }

    if (invalid.length > 0) {
      setError(invalid.join(" | "));
    }

    if (valid.length === 0) return;

    const combined = [...files, ...valid];
    if (combined.length > MAX_FILE_COUNT) {
      setError(
        `Maximum of ${MAX_FILE_COUNT} PDF files can be merged at once.`,
      );
      return;
    }

    setFiles(combined);
  }, [files]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const reorderFiles = (fromIndex: number, toIndex: number) => {
    setFiles((prev) => {
      const next = [...prev];
      const moved = next.splice(fromIndex, 1)[0];
      let insertIndex = toIndex;
      if (fromIndex < toIndex) insertIndex = toIndex - 1;
      next.splice(insertIndex, 0, moved);
      return next;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (draggedIndex === null || draggedIndex === index) return;
    reorderFiles(draggedIndex, index);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleZoneDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    addIncomingFiles(Array.from(e.dataTransfer.files));
  }, [addIncomingFiles]);

  const handleZoneDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleZoneDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      addIncomingFiles(Array.from(e.target.files || []));
      if (inputRef.current) inputRef.current.value = "";
    },
    [addIncomingFiles]
  );

  const merge = async () => {
    if (files.length < 2) return;
    setMerging(true);
    setError(null);
    setResult(null);

    try {
      const res = await mergePdf(files);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Merge failed. Please try again.");
    } finally {
      setMerging(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFiles([]);
    setResult(null);
    setError(null);
    setMerging(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Merge PDF",
    url: "https://www.getzipdrop.com/pdf/merge",
    applicationCategory: "FileConverter",
    operatingSystem: "Web",
    description: "Free online PDF merger. Combine multiple PDF files into one document, reorder before merging, and download. No account required.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    creator: {
      "@type": "Organization",
      name: "ZipDrop",
      url: "https://www.getzipdrop.com",
    },
  };

  const header = (
    <UnifiedToolHeader
      breadcrumbs={breadcrumbItems}
      backHref="/"
      icon={<FileText size={26} strokeWidth={2} />}
      title="Merge PDF"
    />
  );

  const upload = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        multiple
        style={{ display: "none" }}
        disabled={merging}
        onChange={handleFileSelect}
      />

      <div className="zd-tool-drop-wrap">
        <div
          className={`drag-zone ${dragActive ? "dragging" : ""}`}
          onDragOver={handleZoneDragOver}
          onDragLeave={handleZoneDragLeave}
          onDrop={handleZoneDrop}
          onClick={() => !merging && inputRef.current?.click()}
          style={{ cursor: merging ? "not-allowed" : "pointer", opacity: merging ? 0.6 : 1 }}
        >
          <FileText size={48} style={{ color: dragActive ? "var(--primary-teal)" : "var(--text-muted)", transition: "color 0.2s ease" }} />
          <p style={{ fontSize: "16px", fontWeight: 500, color: dragActive ? "var(--primary-teal)" : "var(--text-secondary)", transition: "color 0.2s ease" }}>
            {dragActive ? "Release to drop PDFs" : "Drag & drop PDF files"}
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            or click to browse • PDF only • max {formatBytes(MAX_FILE_SIZE)} per file
          </p>
        </div>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 16px", background: "var(--danger-light)", border: "1px solid rgba(214,69,69,0.20)", borderRadius: "10px" }}>
          <AlertCircle size={20} style={{ color: "var(--danger)", flexShrink: 0, marginTop: "1px" }} />
          <p style={{ fontSize: "13px", color: "var(--danger)", margin: 0 }}>{error}</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="animate-slideUp" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <p className="section-label" style={{ margin: 0 }}>
              {files.length} file{files.length !== 1 ? "s" : ""} uploaded
            </p>
            <button
              onClick={() => !merging && inputRef.current?.click()}
              className="btn-ghost"
              disabled={merging}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                opacity: merging ? 0.5 : 1,
                cursor: merging ? "not-allowed" : "pointer",
              }}
            >
              <Plus size={14} style={{ marginRight: "6px" }} />
              Add More Files
            </button>
          </div>

          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: "0 0 10px" }}>
            {files.length} file{files.length !== 1 ? "s" : ""} • {formatBytes(totalSize)} total
          </p>

          <div className="file-list" style={{ maxHeight: "none" }}>
            {files.map((file, index) => {
              const isDragged = draggedIndex === index;
              const isDropTarget = dragOverIndex === index;
              return (
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  draggable={true}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className="file-item"
                  style={{
                    background: isDragged ? "var(--teal-light)" : isDropTarget ? "var(--blue-light)" : "var(--bg-card)",
                    borderColor: isDragged ? "var(--primary-teal)" : isDropTarget ? "var(--secondary-blue)" : "var(--border)",
                    opacity: isDragged ? 0.9 : 1,
                  }}
                >
                  <div
                    style={{
                      color: "var(--text-muted)",
                      cursor: "grab",
                      flexShrink: 0,
                      padding: "2px",
                      marginRight: "4px",
                    }}
                    title="Drag to reorder"
                  >
                    <GripHorizontal size={16} />
                  </div>

                  <span style={{ color: "var(--primary-teal)", flexShrink: 0 }}>
                    <FileText size={18} />
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
                      {file.name}
                    </p>
                    <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{formatBytes(file.size)}</span>
                      <span style={{ color: "var(--text-muted)" }}>•</span>
                      <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>#{index + 1}</span>
                    </p>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                    className="btn-ghost"
                    style={{ padding: "4px", borderRadius: "6px", flexShrink: 0 }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  const action = (
    <ToolActionButton
      onClick={merge}
      disabled={merging || files.length < 2}
      loading={merging}
      loadingText="Merging your PDFs…"
      icon={<FileText size={20} />}
      loadingIcon={<Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />}
    >
      Merge PDF
    </ToolActionButton>
  );

  const resultPanel = result && (
    <div className="animate-scaleIn" style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "8px", marginTop: "16px" }}>
      <div className="divider" />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 40, height: 40, borderRadius: "10px", background: "var(--green-light)", border: "1px solid rgba(37,166,83,0.24)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--green-highlight)" }}>
            <Check size={20} />
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              PDFs merged successfully
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
              {result.stats.inputFiles} file{result.stats.inputFiles !== 1 ? "s" : ""} merged • {result.stats.pageCount} page{result.stats.pageCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={downloadResult}
          className="btn-cyan"
          style={{ padding: "12px 20px" }}
        >
          <Download size={18} />
          Download PDF
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginTop: "8px" }}>
        <div style={{ padding: "12px", background: "var(--editor-workspace)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
            Output file
          </p>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {result.filename}
          </p>
        </div>
        <div style={{ padding: "12px", background: "var(--editor-workspace)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
            Final size
          </p>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
            {formatBytes(result.stats.outputSize)}
          </p>
        </div>
        <div style={{ padding: "12px", background: "var(--editor-workspace)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
            Original total
          </p>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
            {formatBytes(result.stats.originalTotalSize)}
          </p>
        </div>
        <div style={{ padding: "12px", background: "var(--editor-workspace)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
            Pages
          </p>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
            {result.stats.pageCount}
          </p>
        </div>
      </div>

      <button
        onClick={reset}
        className="btn-ghost"
        style={{ width: "100%", justifyContent: "center" }}
      >
        <ArrowLeft size={16} />
        Merge another set
      </button>
    </div>
  );

  const footer = (
    <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "16px" }}>
      Files are processed securely and deleted after merging. No permanent storage.
    </p>
  );

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <UnifiedToolPage
        header={header}
        upload={upload}
        action={action}
        result={resultPanel}
        footer={footer}
        showFooterMessage={false}
      />
    </>
  );
}
