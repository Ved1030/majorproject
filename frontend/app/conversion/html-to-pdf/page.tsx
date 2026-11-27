"use client";

import { useState, useCallback, useRef } from "react";
import { ArrowLeft, Globe, Download, Check, X, Loader2, AlertCircle, Settings } from "lucide-react";
import Navbar from "../../../components/Navbar";
import UnifiedToolPage from "@/components/tool/UnifiedToolPage";
import UnifiedToolHeader from "@/components/tool/UnifiedToolHeader";
import ToolInfoBlock from "@/components/tool/ToolInfoBlock";
import ToolUploadArea from "@/components/tool/ToolUploadArea";
import ToolActionButton from "@/components/tool/ToolActionButton";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.getzipdrop.com";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

interface ConversionResult {
  blob: Blob;
  filename: string;
}

export default function HtmlToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageSize, setPageSize] = useState("A4");
  const [orientation, setOrientation] = useState("portrait");
  const [marginTop, setMarginTop] = useState(20);
  const [marginBottom, setMarginBottom] = useState(20);
  const [marginLeft, setMarginLeft] = useState(20);
  const [marginRight, setMarginRight] = useState(20);
  const [printBackground, setPrintBackground] = useState(true);
  const [scale, setScale] = useState(1.0);
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
    const validTypes = ["text/html", "application/xhtml+xml"];
    const validExts = [".html", ".htm"];
    if (!validTypes.includes(f.type) && !validExts.some(ext => f.name.toLowerCase().endsWith(ext))) {
      return "Please select an HTML file (HTML or HTM).";
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
      formData.append("marginTop", marginTop.toString());
      formData.append("marginBottom", marginBottom.toString());
      formData.append("marginLeft", marginLeft.toString());
      formData.append("marginRight", marginRight.toString());
      formData.append("printBackground", printBackground.toString());
      formData.append("scale", scale.toString());

      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 500);

      const response = await fetch(`${API}/convert/html-to-pdf`, {
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
      const filename = file.name.replace(/\.(html|htm)$/i, ".pdf");
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
        { name: "HTML to PDF", href: "/conversion/html-to-pdf" },
      ]}
      backHref="/conversion"
      backLabel="Back to conversion tools"
      icon={<Globe size={26} strokeWidth={2} />}
      title="HTML to PDF"
    />
  );

  const upload = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".html,.htm"
        hidden
        onChange={(e) => handleFileSelect((e.target as HTMLInputElement).files?.[0] ?? null)}
        disabled={converting}
      />
      <div className="zd-tool-drop-wrap">
        <ToolUploadArea
          label="Drag & drop an HTML file"
          subLabel="or click to browse (max 25 MB)"
          icon={<Globe size={54} strokeWidth={1.6} style={{ color: "var(--primary-teal)" }} />}
          accept=".html,.htm"
          onFileSelect={(files) => handleFileSelect(files?.[0] ?? null)}
          disabled={converting}
          dragActive={dragActive}
          setDragActive={setDragActive}
        />
      </div>

      {file && (
        <div className="animate-slideUp" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "var(--teal-light)", border: "1px solid rgba(7,140,145,0.24)", borderRadius: "12px" }}>
          <Globe size={24} style={{ color: "var(--primary-teal)" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {file.name}
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
              {formatBytes(file.size)} • HTML file
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
              <option value="Letter">Letter (8.5 × 11 in)</option>
              <option value="Legal">Legal (8.5 × 14 in)</option>
              <option value="A3">A3 (297 × 420 mm)</option>
              <option value="A5">A5 (148 × 210 mm)</option>
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
            <label className="zd-tool-option-label">Scale</label>
            <input type="number" value={scale} onChange={(e) => setScale(Math.max(0.1, Math.min(2, parseFloat(e.target.value) || 1)))} min="0.1" max="2" step="0.1" disabled={converting} className="neon-input" style={{ padding: "10px 12px", fontSize: "13px" }} />
          </div>
          <div className="zd-tool-check-row">
            <label>
              <input type="checkbox" checked={printBackground} onChange={(e) => setPrintBackground(e.target.checked)} disabled={converting} />
              Print Background
            </label>
          </div>
          <div className="zd-tool-option-full">
            <label className="zd-tool-option-label">Margins (mm)</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px" }}>
              <div>
                <label className="zd-tool-option-label" style={{ fontSize: "10px", color: "var(--text-muted)" }}>Top</label>
                <input type="number" value={marginTop} onChange={(e) => setMarginTop(Math.max(0, parseFloat(e.target.value) || 0))} step="1" min="0" disabled={converting} className="neon-input" style={{ padding: "8px 10px", fontSize: "12px" }} />
              </div>
              <div>
                <label className="zd-tool-option-label" style={{ fontSize: "10px", color: "var(--text-muted)" }}>Bottom</label>
                <input type="number" value={marginBottom} onChange={(e) => setMarginBottom(Math.max(0, parseFloat(e.target.value) || 0))} step="1" min="0" disabled={converting} className="neon-input" style={{ padding: "8px 10px", fontSize: "12px" }} />
              </div>
              <div>
                <label className="zd-tool-option-label" style={{ fontSize: "10px", color: "var(--text-muted)" }}>Left</label>
                <input type="number" value={marginLeft} onChange={(e) => setMarginLeft(Math.max(0, parseFloat(e.target.value) || 0))} step="1" min="0" disabled={converting} className="neon-input" style={{ padding: "8px 10px", fontSize: "12px" }} />
              </div>
              <div>
                <label className="zd-tool-option-label" style={{ fontSize: "10px", color: "var(--text-muted)" }}>Right</label>
                <input type="number" value={marginRight} onChange={(e) => setMarginRight(Math.max(0, parseFloat(e.target.value) || 0))} step="1" min="0" disabled={converting} className="neon-input" style={{ padding: "8px 10px", fontSize: "12px" }} />
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
      icon={<Globe size={20} />}
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
          "Full CSS support including Flexbox, Grid, and media queries",
          "Embedded images and base64 data URIs supported",
          "Relative asset paths resolved automatically",
          "JavaScript disabled for security",
          "Print-specific CSS (@page, @media print) respected",
          "Page breaks and margins configurable",
        ]}
        variant="notes"
      />
      <ToolInfoBlock
        title="Limitations & Security"
        items={[
          "External resources (fonts, images, CSS) not loaded for security",
          "JavaScript execution disabled - no dynamic content rendering",
          "Forms, inputs, and interactive elements not functional",
          "Local file access and network requests blocked",
          "Very large or complex HTML may timeout (3 min limit)",
          "Maximum file size: 25 MB",
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
              Conversion complete
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
      <button
        onClick={reset}
        className="btn-ghost"
        style={{ width: "100%", justifyContent: "center" }}
      >
        <ArrowLeft size={16} />
        Convert another file
      </button>
    </div>
  );

  return (
    <>
      <Navbar />
      <UnifiedToolPage
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
