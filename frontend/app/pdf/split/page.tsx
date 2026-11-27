"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import {
  FileText,
  FilePenLine,
  Download,
  Check,
  X,
  Loader2,
  AlertCircle,
  Plus,
  Minus,
  Scissors,
  LayoutGrid,
  File,
  Save,
} from "lucide-react";
import Navbar from "../../../components/Navbar";
import UnifiedToolPage from "../../../components/tool/UnifiedToolPage";
import UnifiedToolHeader from "../../../components/tool/UnifiedToolHeader";
import ToolActionButton from "../../../components/tool/ToolActionButton";
import PostProcessingActions from "@/components/tool/PostProcessingActions";
import {
  describeTransferError,
  openGeneratedFileInEditor,
} from "@/utils/editorHandoff";
import { splitPdf } from "../../../utils/api";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB (existing PDF limit)

type SplitMode = "ranges" | "every_n" | "every_page";

interface Range {
  start: number;
  end: number;
}

interface SplitResult {
  blob: Blob;
  filename: string;
  stats: {
    inputPages: number;
    outputFiles: number;
    mode: string;
    originalTotalSize: number;
    outputSize: number;
    totalOutputSize: number;
  };
  outputs: Array<{
    filename: string;
    pages: string;
    pageCount: number;
  }>;
}

const breadcrumbItems = [
  { name: "PDF Tools", href: "/conversion" },
  { name: "Split PDF", href: "/pdf/split" },
];

const MODES: Array<{ id: SplitMode; label: string; icon: React.ElementType; description: string }> = [
  {
    id: "ranges",
    label: "By Page Ranges",
    icon: Scissors,
    description: "Custom ranges, e.g. pages 1-5, 6-10",
  },
  {
    id: "every_n",
    label: "Every N Pages",
    icon: LayoutGrid,
    description: "Fixed number of pages per output",
  },
  {
    id: "every_page",
    label: "Every Page",
    icon: File,
    description: "One PDF per page",
  },
];

export default function SplitPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [mode, setMode] = useState<SplitMode>("ranges");
  const [ranges, setRanges] = useState<Range[]>([{ start: 1, end: 5 }]);
  const [everyN, setEveryN] = useState<number>(5);
  const [splitting, setSplitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SplitResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [editingOutput, setEditingOutput] = useState<string | null>(null);
  const [outputEditError, setOutputEditError] = useState<string | null>(null);
  const editingOutputRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return String(err);
};

  // ---- PDF page count via pdf-lib (pure JS, no worker) ----
  const readPageCount = useCallback((f: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const bytes = new Uint8Array(reader.result as ArrayBuffer);
        const pdf = await PDFDocument.load(bytes);
        setPageCount(pdf.getPageCount());
        setError(null);
      } catch {
        setPageCount(null);
        setError("Unable to read PDF pages. The file may be corrupt.");
      }
    };
    reader.onerror = () => {
      setPageCount(null);
      setError("Failed to read the uploaded file.");
    };
    reader.readAsArrayBuffer(f);
  }, []);

  const acceptFile = useCallback(
    (f: File) => {
      const isPdf =
        f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        setError("Unsupported format. Only PDF files are allowed.");
        return;
      }
      if (f.size === 0) {
        setError("Empty file uploaded.");
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        setError(`File is too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`);
        return;
      }
      setFile(f);
      setPageCount(null);
      setError(null);
      setResult(null);
      readPageCount(f);
    },
    [readPageCount]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = (e.target.files || [])[0];
      if (f) acceptFile(f);
      if (inputRef.current) inputRef.current.value = "";
    },
    [acceptFile]
  );

  const handleZoneDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const f = e.dataTransfer.files[0];
      if (f) acceptFile(f);
    },
    [acceptFile]
  );

  const handleZoneDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleZoneDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const removeFile = () => {
    setFile(null);
    setPageCount(null);
    setError(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // ---- Range editing ----
  const clamp = (v: number, min: number, max: number) =>
    Math.min(Math.max(v, min), max);

  const updateRange = (index: number, field: "start" | "end", value: number) => {
    setError(null);
    setRanges((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRange = () => {
    setError(null);
    setRanges((prev) => {
      const last = prev[prev.length - 1];
      const defaultStart = last ? clamp(last.end + 1, 1, pageCount || 1) : 1;
      const defaultEnd = clamp(defaultStart, 1, pageCount || 1);
      return [...prev, { start: defaultStart, end: defaultEnd }];
    });
  };

  const removeRange = (index: number) => {
    setRanges((prev) => prev.filter((_, i) => i !== index));
    if (ranges.length === 1) setError(null);
  };

  // ---- Validation ----
  const rangeErrors = useMemo(() => {
    const errs: string[] = [];
    if (!pageCount) return errs;
    const seen = new Set<number>();
    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i];
      if (r.start < 1) {
        errs.push(`Range ${i + 1}: start page must be at least 1`);
      }
      if (r.end < r.start) {
        errs.push(`Range ${i + 1}: end page must be >= start page`);
      }
      if (r.end > pageCount) {
        errs.push(`Range ${i + 1}: end page exceeds total pages (${pageCount})`);
      }
      for (let p = r.start; p <= r.end; p++) {
        if (seen.has(p)) {
          errs.push(`Range ${i + 1}: page ${p} is included in multiple ranges`);
        } else {
          seen.add(p);
        }
      }
    }
    return errs;
  }, [ranges, pageCount]);

  const modeInvalid = useMemo(() => {
    if (!pageCount) return "Please upload a PDF first.";
    if (mode === "every_n") {
      if (!everyN || everyN < 1) return "Pages per file must be at least 1.";
    }
    if (mode === "ranges") {
      if (ranges.length === 0) return "Add at least one page range.";
      if (rangeErrors.length > 0) return rangeErrors.join(" | ");
    }
    return null;
  }, [mode, everyN, ranges, pageCount, rangeErrors]);

  const expectedOutputs = useMemo(() => {
    if (!pageCount) return 0;
    if (mode === "ranges") return ranges.length;
    if (mode === "every_n") return Math.max(1, Math.ceil(pageCount / Math.max(1, everyN)));
    return pageCount;
  }, [mode, everyN, ranges.length, pageCount]);

  const coveredPages = useMemo(() => {
    if (!pageCount) return 0;
    const covered = new Set<number>();
    for (const r of ranges) {
      for (let p = r.start; p <= r.end && p <= pageCount; p++) covered.add(p);
    }
    return covered.size;
  }, [ranges, pageCount]);

  const uncoveredNote = useMemo(() => {
    if (mode !== "ranges" || !pageCount) return null;
    const uncovered = pageCount - coveredPages;
    if (uncovered === 0) return null;
    return `${uncovered} page${uncovered !== 1 ? "s" : ""} not included in any range will be omitted.`;
  }, [mode, pageCount, coveredPages]);

  const split = async () => {
    if (!file) return;
    if (modeInvalid) {
      setError(modeInvalid);
      return;
    }
    setSplitting(true);
    setError(null);
    setResult(null);

    try {
      const config: {
        mode: SplitMode;
        ranges?: Range[];
        everyN?: number;
      } = { mode };
      if (mode === "ranges") config.ranges = ranges;
      if (mode === "every_n") config.everyN = everyN;

      const res = await splitPdf(file, config);
      setResult(res);
    } catch (err) {
      setError(getErrorMessage(err) || "Split failed. Please try again.");
    } finally {
      setSplitting(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    if (!result) return;
    downloadBlob(result.blob, result.filename);
  };

  const getIndividualPdf = async (output: {
    filename: string;
    pages: string;
    pageCount: number;
  }): Promise<Blob | null> => {
    if (!result) return null;
    const zip = await JSZip.loadAsync(result.blob);
    const entry = zip.file(output.filename);
    if (!entry) {
      setError(`Could not find ${output.filename} in the archive.`);
      return null;
    }
    const data = await entry.async("arraybuffer");
    return new Blob([data], { type: "application/pdf" });
  };

  const downloadIndividual = async (output: {
    filename: string;
    pages: string;
    pageCount: number;
  }) => {
    if (!result) return;
    try {
      const blob = await getIndividualPdf(output);
      if (blob) downloadBlob(blob, output.filename);
    } catch (err) {
      setError(getErrorMessage(err) || `Failed to extract ${output.filename}`);
    }
  };

  const editIndividual = async (output: {
    filename: string;
    pages: string;
    pageCount: number;
  }) => {
    if (editingOutputRef.current) return;
    editingOutputRef.current = output.filename;
    setEditingOutput(output.filename);
    setOutputEditError(null);
    try {
      const blob = await getIndividualPdf(output);
      if (!blob) return;
      await openGeneratedFileInEditor(
        { blob, filename: output.filename },
        "pdf-split"
      );
    } catch (err) {
      setOutputEditError(describeTransferError(err));
    } finally {
      editingOutputRef.current = null;
      setEditingOutput(null);
    }
  };

  const reset = () => {
    setFile(null);
    setPageCount(null);
    setMode("ranges");
    setRanges([{ start: 1, end: 5 }]);
    setEveryN(5);
    setError(null);
    setOutputEditError(null);
    setResult(null);
    setSplitting(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Split PDF",
    url: "https://www.getzipdrop.com/pdf/split",
    applicationCategory: "FileConverter",
    operatingSystem: "Web",
    description: "Free online PDF splitter. Split a PDF into multiple documents by page ranges, every N pages, or one PDF per page. No account required.",
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

  const uploadDisabled = splitting;
  const controlsDisabled = splitting || !file;

  const header = (
    <UnifiedToolHeader
      breadcrumbs={breadcrumbItems}
      backHref="/"
      icon={<FileText size={26} strokeWidth={2} />}
      title="Split PDF"
      description="Split a PDF into multiple documents by page ranges or page count."
    />
  );

  const upload = (
    <>
      <div className="zd-tool-drop-wrap">
        <div
          className={`drag-zone ${dragActive ? "dragging" : ""}`}
          onDragOver={handleZoneDragOver}
          onDragLeave={handleZoneDragLeave}
          onDrop={handleZoneDrop}
          onClick={() => !uploadDisabled && inputRef.current?.click()}
          style={{ cursor: uploadDisabled ? "not-allowed" : "pointer", opacity: uploadDisabled ? 0.6 : 1 }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            style={{ display: "none" }}
            disabled={uploadDisabled}
            onChange={handleFileSelect}
          />
          <FileText size={48} style={{ color: dragActive ? "var(--primary-teal)" : "var(--text-muted)", transition: "color 0.2s ease" }} />
          <p style={{ fontSize: "16px", fontWeight: 500, color: dragActive ? "var(--primary-teal)" : "var(--text-secondary)", transition: "color 0.2s ease" }}>
            {dragActive ? "Release to drop PDF" : "Drag & drop a PDF"}
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            or click to browse • PDF only • max {formatBytes(MAX_FILE_SIZE)}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 16px", background: "var(--danger-light)", border: "1px solid rgba(214,69,69,0.20)", borderRadius: "10px" }}>
          <AlertCircle size={20} style={{ color: "var(--danger)", flexShrink: 0, marginTop: "1px" }} />
          <p style={{ fontSize: "13px", color: "var(--danger)", margin: 0 }}>{error}</p>
        </div>
      )}

      {file && (
        <div className="animate-slideUp" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <p className="section-label" style={{ margin: 0 }}>
              PDF uploaded
            </p>
            <button
              onClick={() => !uploadDisabled && inputRef.current?.click()}
              className="btn-ghost"
              disabled={uploadDisabled}
              style={{ padding: "6px 12px", fontSize: "12px", opacity: uploadDisabled ? 0.5 : 1, cursor: uploadDisabled ? "not-allowed" : "pointer" }}
            >
              <Plus size={14} style={{ marginRight: "6px" }} />
              Replace PDF
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary-teal)", flexShrink: 0 }}>
              <FileText size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
                {file.name}
              </p>
              <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>{formatBytes(file.size)}</span>
                {pageCount !== null ? (
                  <>
                    <span style={{ color: "var(--text-muted)" }}>•</span>
                    <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{pageCount} page{pageCount !== 1 ? "s" : ""}</span>
                  </>
                ) : (
                  <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>reading pages…</span>
                )}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); removeFile(); }}
              className="btn-ghost"
              style={{ padding: "4px", borderRadius: "6px", flexShrink: 0 }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );

  const controls = file && pageCount !== null && (
    <div className="animate-slideUp" style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "8px" }}>
      <p className="section-label" style={{ margin: 0 }}>Split mode</p>

      <div style={{
        display: "flex",
        gap: "6px",
        background: "var(--editor-workspace)",
        padding: "4px",
        borderRadius: "10px",
        border: "1px solid var(--border)",
      }}>
        {MODES.map((m) => {
          const active = mode === m.id;
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: "8px",
                border: "none",
                background: active ? "var(--primary-teal)" : "transparent",
                color: active ? "white" : "var(--text-secondary)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: controlsDisabled ? "not-allowed" : "pointer",
                opacity: controlsDisabled ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
              disabled={controlsDisabled}
            >
              <Icon size={14} strokeWidth={2} />
              <span style={{ display: "none" }}>{m.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" }}>
        {MODES.map((m) => {
          if (mode !== m.id) return null;
          return (
            <div
              key={m.id}
              style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "var(--text-secondary)" }}
            >
              <m.icon size={14} strokeWidth={2} style={{ color: "var(--primary-teal)", flexShrink: 0 }} />
              <span>{m.description}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
        {mode === "ranges" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
              <p className="section-label" style={{ margin: 0, fontSize: "13px" }}>Page ranges</p>
              <button
                onClick={addRange}
                className="btn-ghost"
                disabled={controlsDisabled}
                style={{ padding: "4px 10px", fontSize: "12px", opacity: controlsDisabled ? 0.5 : 1, cursor: controlsDisabled ? "not-allowed" : "pointer" }}
              >
                <Plus size={12} style={{ marginRight: "6px" }} /> Add range
              </button>
            </div>
            {ranges.map((range, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 10px",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  background: "var(--bg-card)",
                }}
              >
                <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-muted)", flexShrink: 0, minWidth: "20px" }}>
                  PDF {index + 1}
                </span>
                <label style={{ fontSize: "12.5px", color: "var(--text-secondary)", flexShrink: 0, minWidth: "55px", userSelect: "none" }}>From</label>
                <input
                  type="number"
                  min="1"
                  value={range.start}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10) || 1;
                    updateRange(index, "start", clamp(v, 1, pageCount));
                  }}
                  style={{ width: "60px", padding: "6px 8px", fontSize: "12.5px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-main)" }}
                  disabled={controlsDisabled}
                />
                <span style={{ fontSize: "12.5px", color: "var(--text-muted)", flexShrink: 0 }}>to</span>
                <input
                  type="number"
                  min="1"
                  value={range.end}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10) || 1;
                    updateRange(index, "end", clamp(v, 1, pageCount));
                  }}
                  style={{ width: "60px", padding: "6px 8px", fontSize: "12.5px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-main)" }}
                  disabled={controlsDisabled}
                />
                <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--primary-teal)", flexShrink: 0 }}>
                  ({range.end - range.start + 1} pages)
                </span>
                <button
                  onClick={() => removeRange(index)}
                  className="btn-ghost"
                  style={{ padding: "4px", borderRadius: "6px", flexShrink: 0, color: "var(--text-muted)" }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Minus size={12} />
                </button>
              </div>
            ))}
            {rangeErrors.length > 0 && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "8px 10px", background: "var(--danger-light)", border: "1px solid rgba(214,69,69,0.20)", borderRadius: "8px", marginTop: "6px" }}>
                <AlertCircle size={16} style={{ color: "var(--danger)", flexShrink: 0, marginTop: "2px" }} />
                <p style={{ fontSize: "12px", color: "var(--danger)", margin: 0, lineHeight: 1.4 }}>{rangeErrors.join(" | ")}</p>
              </div>
            )}
          </div>
        )}

        {mode === "every_n" && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="section-label" style={{ margin: 0, fontSize: "13px" }}>Pages per output PDF</span>
            <input
              type="number"
              min="1"
              value={everyN}
              onChange={(e) => setEveryN(Math.max(1, parseInt(e.target.value, 10) || 1))}
              style={{ width: "80px", padding: "6px 10px", fontSize: "13px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-main)" }}
              disabled={controlsDisabled}
            />
            <span style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
              Produces {expectedOutputs} PDF{expectedOutputs !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {mode === "every_page" && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="section-label" style={{ margin: 0, fontSize: "13px" }}>One PDF per page</span>
            <span style={{ fontSize: "12.5px", color: "var(--text-secondary)", fontWeight: 600 }}>
              Produces {pageCount} PDF{pageCount !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      <div style={{
        padding: "12px 14px",
        background: "var(--teal-light)",
        border: "1px solid rgba(7,140,145,0.20)",
        borderRadius: "10px",
        marginTop: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "start", gap: "10px" }}>
          <Save size={16} style={{ color: "var(--primary-teal)", flexShrink: 0, marginTop: "2px" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>
              Expected output
            </p>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--primary-teal)", margin: "0 0 2px" }}>
              {expectedOutputs} PDF{expectedOutputs !== 1 ? "s" : ""} will be created
            </p>
            {uncoveredNote && (
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>{uncoveredNote}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const action = file && pageCount !== null && (
    <ToolActionButton
      onClick={split}
      disabled={splitting || !file || !!modeInvalid}
      loading={splitting}
      loadingText="Splitting your PDF…"
      icon={<Scissors size={20} />}
      loadingIcon={<Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />}
    >
      Split PDF
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
              Processing complete
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
              {result.stats.outputFiles} PDF{result.stats.outputFiles !== 1 ? "s" : ""} created • {result.stats.inputPages} page{result.stats.inputPages !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>
        <button
          onClick={downloadAll}
          className="btn-cyan"
          disabled={splitting}
          style={{ padding: "12px 20px", opacity: splitting ? 0.5 : 1 }}
        >
          <Download size={18} />
          Download All (ZIP)
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginTop: "8px" }}>
        <div style={{ padding: "12px", background: "var(--editor-workspace)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
            Output archive
          </p>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {result.filename}
          </p>
        </div>
        <div style={{ padding: "12px", background: "var(--editor-workspace)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
            Archive size
          </p>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
            {formatBytes(result.stats.outputSize)}
          </p>
        </div>
        <div style={{ padding: "12px", background: "var(--editor-workspace)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
            Input pages
          </p>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
            {result.stats.inputPages}
          </p>
        </div>
        <div style={{ padding: "12px", background: "var(--editor-workspace)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
            Mode
          </p>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0, textTransform: "capitalize" }}>
            {result.stats.mode}
          </p>
        </div>
      </div>

      <div style={{ marginTop: "10px" }}>
        <p className="section-label" style={{ margin: "0 0 8px 0", fontSize: "13px" }}>Download individual PDFs</p>
        {outputEditError && (
          <p style={{ fontSize: "12px", color: "var(--danger)", margin: "0 0 8px 0" }}>
            {outputEditError}
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {result.outputs.map((output) => (
            <div
              key={output.filename}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                <span style={{ color: "var(--primary-teal)", flexShrink: 0 }}>
                  <FileText size={16} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
                    {output.filename}
                  </p>
                  <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Pages {output.pages} • {output.pageCount} page{output.pageCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button
                  onClick={() => editIndividual(output)}
                  disabled={splitting || editingOutput !== null}
                  className="btn-ghost"
                  style={{ padding: "6px 12px", fontSize: "12px", opacity: splitting || editingOutput !== null ? 0.5 : 1 }}
                >
                  {editingOutput === output.filename ? (
                    <Loader2 size={14} className="zd-spin" style={{ marginRight: "6px" }} />
                  ) : (
                    <FilePenLine size={14} style={{ marginRight: "6px" }} />
                  )}
                  Edit
                </button>
                <button
                  onClick={() => downloadIndividual(output)}
                  disabled={splitting}
                  className="btn-ghost"
                  style={{ padding: "6px 12px", fontSize: "12px", opacity: splitting ? 0.5 : 1, cursor: splitting ? "not-allowed" : "pointer" }}
                >
                  <Download size={14} style={{ marginRight: "6px" }} />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PostProcessingActions
        file={result.blob}
        filename={result.filename}
        onReset={reset}
        resetLabel="Process Another PDF"
      />
    </div>
  );

  const footer = (
    <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "16px" }}>
      Files are processed securely and deleted after splitting. No permanent storage.
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
        toolId="split-pdf"
        header={header}
        upload={upload}
        controls={controls}
        action={action}
        result={resultPanel}
        footer={footer}
        showFooterMessage={false}
      />
    </>
  );
}
