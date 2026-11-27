"use client";

import { useState, useCallback, useRef } from "react";
import { FileText, Loader2, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { ShareProcessedFileButton } from "@/components/seo/ProcessedFileShareCta";
import UnifiedToolPage from "@/components/tool/UnifiedToolPage";
import UnifiedToolHeader from "@/components/tool/UnifiedToolHeader";
import ToolInfoBlock from "@/components/tool/ToolInfoBlock";
import ToolUploadArea from "@/components/tool/ToolUploadArea";
import ToolFilePreview from "@/components/tool/ToolFilePreview";
import ToolActionButton from "@/components/tool/ToolActionButton";
import ToolResultPanel from "@/components/tool/ToolResultPanel";
import ToolModeSelection from "@/components/tool/ToolModeSelection";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.getzipdrop.com";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const breadcrumbItems = [
  { name: "Conversion Tools", href: "/conversion" },
  { name: "PDF to Word", href: "/conversion/pdf-to-word" },
];

const relatedLinks = [
  { href: "/compression/pdf", label: "Compress PDF" },
  { href: "/conversion/pdf-to-excel", label: "PDF to Excel" },
  { href: "/conversion", label: "All conversion tools" },
];

type ConversionMode = "editable" | "visual-fidelity";

interface ConversionResult {
  blob: Blob;
  filename: string;
}

const modeOptions = [
  {
    value: "editable",
    label: "Editable Word",
    description: "Reconstructs text, tables, and images as editable Word elements. Best for documents you need to edit.",
  },
  {
    value: "visual-fidelity",
    label: "Visual Fidelity",
    description: "Preserves exact page appearance using positioned elements. Best for complex layouts where visual accuracy matters most.",
  },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdfToWordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ConversionMode>("editable");
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 500);

      const response = await fetch(`${API}/convert/pdf-to-word`, {
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
      const filename = file.name.replace(/\.pdf$/i, ".docx");
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
      breadcrumbs={breadcrumbItems}
      backHref="/conversion"
      backLabel="Back to conversion tools"
      icon={<FileText size={26} strokeWidth={2} />}
      title="PDF to Word"
      description="Use the official ZipDrop PDF to Word tool to convert PDFs into editable DOCX files. Choose Editable mode to revise text and tables, or Visual Fidelity mode to keep the original layout. Maximum file size: 50 MB."
      relatedLinks={relatedLinks}
    />
  );

  const upload = (
    <>
      <div className="zd-tool-drop-wrap">
        <ToolUploadArea
          label="Drag & drop a PDF file"
          subLabel="or click to browse"
          icon={<FileText size={54} strokeWidth={1.6} style={{ color: "var(--primary-teal)" }} />}
          accept=".pdf"
          maxFileSize={MAX_FILE_SIZE}
          formatBytes={formatBytes}
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
    <div className="zd-tool-options-grid">
      <div className="zd-tool-option-full">
        <ToolModeSelection
          title="Conversion Mode"
          modes={modeOptions}
          selectedMode={mode}
          onModeChange={(m) => setMode(m as ConversionMode)}
          disabled={converting}
        />
      </div>
    </div>
  );

  const action = (
    <ToolActionButton
      onClick={convert}
      disabled={converting || !file}
      loading={converting}
      loadingText={`Converting... ${progress}%`}
      icon={<FileText size={20} />}
      loadingIcon={
        <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
      }
    >
      Convert to Word
    </ToolActionButton>
  );

  const instructions = (
    <ToolInfoBlock
      title="Tips for best results"
      items={[
        "Text-based PDFs convert best in <strong>Editable</strong> mode",
        "Scanned/image PDFs work better with <strong>Visual Fidelity</strong> mode",
        "Complex layouts (multi-column, tables) may need Visual Fidelity",
        "Password-protected PDFs cannot be converted",
      ]}
      variant="notes"
    />
  );

  const privacy = (
    <ToolInfoBlock
      title="Privacy & Security"
      items={[
        "Files are processed securely and deleted after conversion",
        "No permanent storage of your documents",
        "Files are not shared with third parties",
      ]}
      variant="privacy"
    />
  );

  const resultPanel = result && (
    <ToolResultPanel
      filename={result.filename}
      mode={mode === "editable" ? "Editable" : "Visual Fidelity"}
      onDownload={downloadResult}
      onReset={reset}
      formatBytes={formatBytes}
      shareButton={
        <ShareProcessedFileButton
          file={new File([result.blob], result.filename, {
            type: result.blob.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          })}
        />
      }
    />
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
        privacy={privacy}
        result={resultPanel}
      />
    </>
  );
}
