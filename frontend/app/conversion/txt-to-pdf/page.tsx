"use client";

import { useState, useCallback, useRef } from "react";
import { FileText, Download, Check, X, Loader2, AlertCircle, Settings } from "lucide-react";
import Navbar from "../../../components/Navbar";
import UnifiedToolPage from "@/components/tool/UnifiedToolPage";
import UnifiedToolHeader from "@/components/tool/UnifiedToolHeader";
import ToolInfoBlock from "@/components/tool/ToolInfoBlock";
import ToolUploadArea from "@/components/tool/ToolUploadArea";
import ToolActionButton from "@/components/tool/ToolActionButton";
import PostProcessingActions from "@/components/tool/PostProcessingActions";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.getzipdrop.com";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ConversionResult {
  blob: Blob;
  filename: string;
}

export default function TextToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageSize, setPageSize] = useState("A4");
  const [orientation, setOrientation] = useState("portrait");
  const [fontSize, setFontSize] = useState(11);
  const [fontFamily, setFontFamily] = useState("DejaVuSans");
  const [alignment, setAlignment] = useState("left");
  const [marginTop, setMarginTop] = useState(25.4);
  const [marginBottom, setMarginBottom] = useState(25.4);
  const [marginLeft, setMarginLeft] = useState(25.4);
  const [marginRight, setMarginRight] = useState(25.4);
  const [pageNumbers, setPageNumbers] = useState(false);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (f: File) => {
    if (f.type !== "text/plain" && !f.name.toLowerCase().endsWith(".txt")) {
      return "Please select a text file (TXT).";
    }
    if (f.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`;
    }
    return null;
  };

  const handleFileSelect = (f: File | null) => {
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const convert = async () => {
    if (!file) return;
    setConverting(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("pageSize", pageSize);
      formData.append("orientation", orientation);
      formData.append("fontSize", fontSize.toString());
      formData.append("fontFamily", fontFamily);
      formData.append("alignment", alignment);
      formData.append("marginTop", marginTop.toString());
      formData.append("marginBottom", marginBottom.toString());
      formData.append("marginLeft", marginLeft.toString());
      formData.append("marginRight", marginRight.toString());
      formData.append("pageNumbers", pageNumbers.toString());

      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 500);

      const response = await fetch(`${API}/convert/text-to-pdf`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Conversion failed: ${response.status}`);
      }

      const blob = await response.blob();
      const filename = file.name.replace(/\.txt$/i, ".pdf");
      setResult({ blob, filename });
    } catch (err: any) {
      setError(err.message || "Conversion failed. Please try again.");
    } finally {
      setConverting(false);
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
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const header = (
    <UnifiedToolHeader
      breadcrumbs={[
        { name: "OTHER CONVERSIONS", href: "/conversion" },
        { name: "Text to PDF", href: "/conversion/txt-to-pdf" },
      ]}
      backHref="/conversion"
      backLabel="Back to conversion tools"
      icon={<FileText size={26} strokeWidth={2} />}
      title="Text to PDF"
    />
  );

  const upload = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".txt"
        hidden
        onChange={(e) => handleFileSelect((e.target as HTMLInputElement).files?.[0] ?? null)}
        disabled={converting}
      />
      <div className="zd-tool-drop-wrap">
        <ToolUploadArea
          label="Drag & drop a text file"
          subLabel="or click to browse (max 10 MB)"
          icon={<FileText size={54} strokeWidth={1.6} style={{ color: "var(--primary-teal)" }} />}
          accept=".txt"
          onFileSelect={(files) => handleFileSelect(files?.[0] ?? null)}
          disabled={converting}
          dragActive={dragActive}
          setDragActive={setDragActive}
        />
      </div>

      {file && (
        <div className="animate-slideUp" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "var(--teal-light)", border: "1px solid rgba(7,140,145,0.24)", borderRadius: "12px" }}>
          <FileText size={24} style={{ color: "var(--primary-teal)" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {file.name}
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
              {formatBytes(file.size)} • Text file
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); reset(); }}
            style={{ padding: "8px", borderRadius: "8px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 16px", background: "var(--danger-light)", border: "1px solid rgba(214,69,69,0.20)", borderRadius: "10px" }}>
          <AlertCircle size={20} style={{ color: "var(--danger)", flexShrink: 0, marginTop: "1px" }} />
          <p style={{ fontSize: "13px", color: "var(--danger)", margin: 0 }}>{error}</p>
        </div>
      )}
    </>
  );

  const controls = (
    <div>
      <div className="zd-tool-options-title">
        <Settings size={17} />
        <h2>Output Options</h2>
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          style={{ marginLeft: "auto", background: "transparent", border: "none", color: "var(--primary-teal)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
        >
          {showOptions ? "Hide" : "Show"}
        </button>
      </div>
      {showOptions && (
        <div className="zd-tool-options-grid">
          <div>
            <label className="zd-tool-option-label">Page Size</label>
            <select value={pageSize} onChange={(e) => setPageSize(e.target.value)} disabled={converting} className="neon-input" style={{ padding: "10px 12px", fontSize: "13px" }}>
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="LETTER">Letter (8.5 × 11 in)</option>
            </select>
          </div>
          <div>
            <label className="zd-tool-option-label">Orientation</label>
            <select value={orientation} onChange={(e) => setOrientation(e.target.value)} disabled={converting} className="neon-input" style={{ padding: "10px 12px", fontSize: "13px" }}>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
          <div>
            <label className="zd-tool-option-label">Font Size (pt)</label>
            <input type="number" value={fontSize} onChange={(e) => setFontSize(Math.max(6, Math.min(72, parseInt(e.target.value) || 11)))} min="6" max="72" disabled={converting} className="neon-input" style={{ padding: "10px 12px", fontSize: "13px" }} />
          </div>
          <div>
            <label className="zd-tool-option-label">Font Family</label>
            <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} disabled={converting} className="neon-input" style={{ padding: "10px 12px", fontSize: "13px" }}>
              <option value="DejaVuSans">DejaVu Sans (Unicode)</option>
              <option value="DejaVuSerif">DejaVu Serif (Unicode)</option>
              <option value="DejaVuSansMono">DejaVu Sans Mono (Unicode)</option>
              <option value="Arial">Arial (Windows)</option>
              <option value="Tahoma">Tahoma (Windows)</option>
              <option value="Calibri">Calibri (Windows)</option>
              <option value="Helvetica">Helvetica (Built-in)</option>
            </select>
          </div>
          <div>
            <label className="zd-tool-option-label">Alignment</label>
            <select value={alignment} onChange={(e) => setAlignment(e.target.value)} disabled={converting} className="neon-input" style={{ padding: "10px 12px", fontSize: "13px" }}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="justify">Justify</option>
            </select>
          </div>
          <div className="zd-tool-option-full zd-tool-check-row">
            <label>
              <input type="checkbox" checked={pageNumbers} onChange={(e) => setPageNumbers(e.target.checked)} disabled={converting} />
              Page Numbers
            </label>
          </div>
          <div className="zd-tool-option-full">
            <label className="zd-tool-option-label">Margins (mm)</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px" }}>
              <div>
                <label className="zd-tool-option-label" style={{ fontSize: "10px", color: "var(--text-muted)" }}>Top</label>
                <input type="number" value={marginTop} onChange={(e) => setMarginTop(Math.max(0, parseFloat(e.target.value) || 0))} step="0.1" min="0" disabled={converting} className="neon-input" style={{ padding: "8px 10px", fontSize: "12px" }} />
              </div>
              <div>
                <label className="zd-tool-option-label" style={{ fontSize: "10px", color: "var(--text-muted)" }}>Bottom</label>
                <input type="number" value={marginBottom} onChange={(e) => setMarginBottom(Math.max(0, parseFloat(e.target.value) || 0))} step="0.1" min="0" disabled={converting} className="neon-input" style={{ padding: "8px 10px", fontSize: "12px" }} />
              </div>
              <div>
                <label className="zd-tool-option-label" style={{ fontSize: "10px", color: "var(--text-muted)" }}>Left</label>
                <input type="number" value={marginLeft} onChange={(e) => setMarginLeft(Math.max(0, parseFloat(e.target.value) || 0))} step="0.1" min="0" disabled={converting} className="neon-input" style={{ padding: "8px 10px", fontSize: "12px" }} />
              </div>
              <div>
                <label className="zd-tool-option-label" style={{ fontSize: "10px", color: "var(--text-muted)" }}>Right</label>
                <input type="number" value={marginRight} onChange={(e) => setMarginRight(Math.max(0, parseFloat(e.target.value) || 0))} step="0.1" min="0" disabled={converting} className="neon-input" style={{ padding: "8px 10px", fontSize: "12px" }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const action = (
    <ToolActionButton
      onClick={convert}
      disabled={converting || !file}
      loading={converting}
      loadingText={`Converting... ${progress}%`}
      icon={<FileText size={20} />}
      loadingIcon={<Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />}
    >
      Convert to PDF
    </ToolActionButton>
  );

  const instructions = (
    <>
      <ToolInfoBlock
        title="Features"
        items={[
          "Preserves all text content, paragraphs, and line breaks",
          "Unicode font support (DejaVu fonts) for Indian languages",
          "Configurable page size, orientation, margins, and fonts",
          "Automatic text wrapping and page breaks",
          "Optional page numbers",
        ]}
        variant="notes"
      />
      <ToolInfoBlock
        title="Limitations"
        items={[
          "Plain text only - no formatting (bold, italic, colors) preserved",
          "Font availability depends on system fonts (DejaVu recommended for Unicode)",
          "Very long lines are wrapped automatically",
          "Images and non-text content cannot be included",
          "Maximum file size: 10 MB",
        ]}
        variant="notes"
      />
    </>
  );

  const resultPanel = result && (
    <div className="animate-scaleIn" style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "8px" }}>
      <div className="divider" />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 40, height: 40, borderRadius: "10px", background: "var(--teal-light)", border: "1px solid rgba(7,140,145,0.24)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-teal)" }}>
            <Check size={20} />
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Processing complete
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
              {result.filename}
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
      <PostProcessingActions
        file={result.blob}
        filename={result.filename}
        onReset={reset}
      />
    </div>
  );

  return (
    <>
      <Navbar />
      <UnifiedToolPage
        toolId="txt-to-pdf"
        header={header}
        upload={upload}
        controls={controls}
        action={action}
        instructions={instructions}
        result={resultPanel}
      />
    </>
  );
}
