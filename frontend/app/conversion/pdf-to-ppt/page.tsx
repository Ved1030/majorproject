"use client";

import { useState, useCallback, useRef } from "react";
import { Presentation, Download, Check, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Navbar from "../../../components/Navbar";
import UnifiedToolPage from "@/components/tool/UnifiedToolPage";
import UnifiedToolHeader from "@/components/tool/UnifiedToolHeader";
import ToolInfoBlock from "@/components/tool/ToolInfoBlock";
import ToolUploadArea from "@/components/tool/ToolUploadArea";
import ToolFilePreview from "@/components/tool/ToolFilePreview";
import ToolActionButton from "@/components/tool/ToolActionButton";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.getzipdrop.com";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

type ConversionMode = "editable" | "visual-fidelity";

interface ConversionResult {
  blob: Blob;
  filename: string;
}

const modeDescriptions = {
  editable: "Reconstructs text, images, and basic elements as editable PowerPoint objects. Best for presentations you need to modify.",
  "visual-fidelity": "Each PDF page becomes a high-resolution slide background image. Preserves exact visual appearance but content is not editable.",
};

const modeLabels = {
  editable: "Editable PowerPoint",
  "visual-fidelity": "Visual Fidelity",
};

export default function PdfToPowerPointPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ConversionMode>("editable");
  const [dpi, setDpi] = useState(200);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (f: File) => {
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      return "Please select a PDF file.";
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
      formData.append("mode", mode);
      formData.append("dpi", dpi.toString());

      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 500);

      const response = await fetch(`${API}/convert/pdf-to-powerpoint`, {
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
      const filename = file.name.replace(/\.pdf$/i, ".pptx");
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
      backHref="/conversion"
      backLabel="Back to conversion tools"
      icon={<Presentation size={26} strokeWidth={2} />}
      title="PDF to PowerPoint"
    />
  );

  const upload = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        hidden
        onChange={(e) => handleFileSelect((e.target as HTMLInputElement).files?.[0] ?? null)}
        disabled={converting}
      />
      <div className="zd-tool-drop-wrap">
        <ToolUploadArea
          label="Drag & drop a PDF file"
          subLabel="or click to browse (max 50 MB)"
          icon={<Presentation size={54} strokeWidth={1.6} style={{ color: "var(--primary-teal)" }} />}
          accept=".pdf"
          onFileSelect={(files) => handleFileSelect(files?.[0] ?? null)}
          disabled={converting}
          dragActive={dragActive}
          setDragActive={setDragActive}
        />
      </div>

      {file && (
        <ToolFilePreview
          file={file}
          onRemove={reset}
          onReplace={() => inputRef.current?.click()}
          compressing={converting}
          formatBytes={formatBytes}
          icon={<Presentation size={24} style={{ color: "var(--primary-teal)" }} />}
        />
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
      <span className="zd-tool-option-label">Conversion Mode</span>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {(["editable", "visual-fidelity"] as ConversionMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1,
              minWidth: "200px",
              padding: "16px 20px",
              borderRadius: "12px",
              border: `2px solid ${mode === m ? "var(--primary-teal)" : "var(--border)"}`,
              background: mode === m ? "var(--teal-light)" : "var(--bg-card)",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (mode !== m) e.currentTarget.style.borderColor = "var(--primary-teal)";
            }}
            onMouseLeave={(e) => {
              if (mode !== m) e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{
                fontSize: "13px",
                fontWeight: 700,
                color: mode === m ? "var(--primary-teal)" : "var(--text-primary)",
                textTransform: "capitalize",
              }}>
                {modeLabels[m]}
              </span>
              {mode === m && <Check size={16} style={{ color: "var(--primary-teal)" }} />}
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              {modeDescriptions[m]}
            </p>
          </button>
        ))}
      </div>

      {mode === "visual-fidelity" && (
        <div className="zd-tool-option-full" style={{ marginTop: "14px", padding: "14px", background: "var(--editor-workspace)", border: "1px solid var(--border)", borderRadius: "12px" }}>
          <label className="zd-tool-option-label" htmlFor="pdf-to-ppt-dpi">
            DPI (Render Quality)
          </label>
          <select
            id="pdf-to-ppt-dpi"
            value={dpi}
            onChange={(e) => setDpi(parseInt(e.target.value))}
            disabled={converting}
            className="neon-input"
            style={{ padding: "10px 12px", fontSize: "13px", maxWidth: "280px" }}
          >
            <option value={150}>150 DPI (Draft)</option>
            <option value={200}>200 DPI (Standard)</option>
            <option value={300}>300 DPI (Print)</option>
            <option value={600}>600 DPI (High Quality)</option>
          </select>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
            Higher DPI = larger file size but better image quality. Each PDF page becomes a full-slide background image.
          </p>
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
      icon={<Presentation size={20} />}
      loadingIcon={<Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />}
    >
      Convert to PowerPoint
    </ToolActionButton>
  );

  const instructions = (
    <ToolInfoBlock
      title="Mode comparison"
      items={[
        "<strong>Editable:</strong> Text, images, and shapes extracted as PPTX objects. You can edit text, move elements, but complex layouts may not reconstruct perfectly.",
        "<strong>Visual Fidelity:</strong> Each page rendered as high-res image. Pixel-perfect appearance preserved, but content is not selectable or editable.",
        "Every PDF page becomes exactly one PowerPoint slide.",
        "Password-protected PDFs cannot be converted.",
      ]}
      variant="notes"
    />
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
              {result.filename} • {modeLabels[mode]} mode
            </p>
          </div>
        </div>
        <button
          onClick={downloadResult}
          className="btn-cyan"
          style={{ padding: "12px 20px" }}
        >
          <Download size={18} />
          Download PPTX
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
