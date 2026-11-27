"use client";

import { useState, useCallback, useRef } from "react";
import { FileCheck, Download, Check, Loader2, AlertCircle, ArrowLeft, Shield } from "lucide-react";
import Navbar from "../../../components/Navbar";
import UnifiedToolPage from "@/components/tool/UnifiedToolPage";
import UnifiedToolHeader from "@/components/tool/UnifiedToolHeader";
import ToolInfoBlock from "@/components/tool/ToolInfoBlock";
import ToolUploadArea from "@/components/tool/ToolUploadArea";
import ToolFilePreview from "@/components/tool/ToolFilePreview";
import ToolActionButton from "@/components/tool/ToolActionButton";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.getzipdrop.com";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

type ConformanceLevel = "pdfa-1b" | "pdfa-2b" | "pdfa-3b";

interface ConversionResult {
  blob: Blob;
  filename: string;
}

const conformanceOptions: { value: ConformanceLevel; label: string; description: string }[] = [
  {
    value: "pdfa-1b",
    label: "PDF/A-1b",
    description: "Basic conformance (ISO 19005-1). Widely supported, no transparency, no layers, no encryption."
  },
  {
    value: "pdfa-2b",
    label: "PDF/A-2b (Recommended)",
    description: "Extended features (ISO 19005-2). Supports transparency, layers, JPEG2000, OpenType fonts. Best for most use cases."
  },
  {
    value: "pdfa-3b",
    label: "PDF/A-3b",
    description: "Embedded files allowed (ISO 19005-3). Can embed arbitrary files (XML, CSV, etc.) alongside the PDF."
  }
];

const conformanceLabels = {
  "pdfa-1b": "PDF/A-1b",
  "pdfa-2b": "PDF/A-2b",
  "pdfa-3b": "PDF/A-3b",
};

export default function PdfToPdfaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [conformance, setConformance] = useState<ConformanceLevel>("pdfa-2b");
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
      formData.append("conformance", conformance);

      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 500);

      const response = await fetch(`${API}/convert/pdf-to-pdfa`, {
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
      const filename = file.name.replace(/\.pdf$/i, "_pdfa.pdf");
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

  const selectedConformance = conformanceOptions.find(c => c.value === conformance);

  const header = (
    <UnifiedToolHeader
      backHref="/conversion"
      backLabel="Back to conversion tools"
      icon={<FileCheck size={26} strokeWidth={2} />}
      title="PDF to PDF/A"
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
          icon={<FileCheck size={54} strokeWidth={1.6} style={{ color: "var(--primary-teal)" }} />}
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
          icon={<FileCheck size={24} style={{ color: "var(--primary-teal)" }} />}
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
      <span className="zd-tool-option-label">PDF/A Conformance Level</span>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {conformanceOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setConformance(opt.value)}
            style={{
              padding: "16px 20px",
              borderRadius: "12px",
              border: `2px solid ${conformance === opt.value ? "var(--primary-teal)" : "var(--border)"}`,
              background: conformance === opt.value ? "var(--teal-light)" : "var(--bg-card)",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (conformance !== opt.value) e.currentTarget.style.borderColor = "var(--primary-teal)";
            }}
            onMouseLeave={(e) => {
              if (conformance !== opt.value) e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: conformance === opt.value ? "var(--primary-teal)" : "var(--text-primary)",
                  }}>
                    {opt.label}
                  </span>
                  {conformance === opt.value && <Check size={16} style={{ color: "var(--primary-teal)" }} />}
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                  {opt.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const action = (
    <ToolActionButton
      onClick={convert}
      disabled={converting || !file}
      loading={converting}
      loadingText={`Converting... ${progress}%`}
      icon={<Shield size={20} />}
      loadingIcon={<Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />}
    >
      Convert to PDF/A
    </ToolActionButton>
  );

  const instructions = (
    <>
      <ToolInfoBlock
        title="What is PDF/A?"
        items={[
          "PDF/A is an ISO-standardized version of PDF for long-term archiving",
          "All fonts are embedded, ensuring consistent rendering forever",
          "Color profiles are standardized (sRGB for PDF/A-2b/3b)",
          "No encryption, no JavaScript, no external references",
          "Metadata requirements ensure document self-description",
        ]}
        variant="notes"
      />
      <ToolInfoBlock
        title="Limitations & Notes"
        items={[
          "Conversion uses Ghostscript - requires Ghostscript installed on server",
          "Password-protected or encrypted PDFs cannot be converted",
          "Some advanced PDF features (3D, multimedia) may be stripped",
          "PDF/A-2b is recommended for most use cases (best feature support)",
          "Output validation is basic - for legal compliance, verify with veraPDF",
          "File size may increase due to font embedding",
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
              {result.filename} • {conformanceLabels[conformance]} conformance
            </p>
          </div>
        </div>
        <button
          onClick={downloadResult}
          className="btn-cyan"
          style={{ padding: "12px 20px" }}
        >
          <Download size={18} />
          Download PDF/A
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
