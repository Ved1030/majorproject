"use client";

import { useState, useCallback, useRef } from "react";
import { Image, Download, Check, Loader2, AlertCircle, Settings } from "lucide-react";
import Navbar from "../../../components/Navbar";
import UnifiedToolPage from "@/components/tool/UnifiedToolPage";
import UnifiedToolHeader from "@/components/tool/UnifiedToolHeader";
import ToolInfoBlock from "@/components/tool/ToolInfoBlock";
import ToolUploadArea from "@/components/tool/ToolUploadArea";
import ToolFilePreview from "@/components/tool/ToolFilePreview";
import ToolActionButton from "@/components/tool/ToolActionButton";
import PostProcessingActions from "@/components/tool/PostProcessingActions";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.getzipdrop.com";
const MAX_FILE_SIZE = 25 * 1024 * 1024;

interface ConversionResult {
  blob: Blob;
  filename: string;
}

const TOOL_NAME = "WEBP to JPG";
const TOOL_DESCRIPTION = "Convert WEBP to widely compatible JPG format";
const CATEGORY = "IMAGE CONVERSIONS";
const ACCEPT = ".webp";
const FILE_TYPE_LABEL = "WEBP image";

export default function WebpToJpgPage() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(90);
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
    const validTypes = ["image/webp"];
    const validExts = [".webp"];
    if (!validTypes.includes(f.type) && !validExts.some(ext => f.name.toLowerCase().endsWith(ext))) {
      return "Please select a WEBP image.";
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
      formData.append("quality", quality.toString());

      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 20, 90));
      }, 300);

      const response = await fetch(`${API}/convert/webp-to-jpg`, {
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
      const filename = file.name.replace(/\.webp$/i, ".jpg");
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
      icon={<Image size={26} strokeWidth={2} />}
      title={TOOL_NAME}
      description={TOOL_DESCRIPTION}
    />
  );

  const upload = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
        disabled={converting}
      />
      <div className="zd-tool-drop-wrap">
        <ToolUploadArea
          label="Drag & drop a WEBP image"
          subLabel="or click to browse (max 25 MB)"
          icon={<Image size={54} strokeWidth={1.6} style={{ color: "var(--primary-teal)" }} />}
          accept={ACCEPT}
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
          icon={<Image size={24} style={{ color: "var(--primary-teal)" }} />}
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
      <div className="zd-tool-options-title">
        <Settings size={17} />
        <h2>Conversion Options</h2>
      </div>
      <div className="zd-tool-options-grid">
        <div className="zd-tool-option-full zd-tool-quality-row">
          <div className="zd-tool-quality-control">
            <label className="zd-tool-option-label" htmlFor="webp-to-jpg-quality">JPG Quality</label>
            <input
              id="webp-to-jpg-quality"
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              disabled={converting}
            />
          </div>
          <span className="zd-tool-quality-value">{quality}%</span>
        </div>
      </div>
      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
        Animated WEBP files will use the first frame. Transparent pixels are composited onto white.
      </p>
    </div>
  );

  const action = (
    <ToolActionButton
      onClick={convert}
      disabled={converting || !file}
      loading={converting}
      loadingText={`Converting... ${progress}%`}
      icon={<Image size={20} />}
      loadingIcon={<Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />}
    >
      Convert to JPG
    </ToolActionButton>
  );

  const instructions = (
    <ToolInfoBlock
      title="Notes"
      items={[
        "Animated WEBP: only the first frame is converted",
        "Transparent pixels are composited onto a white background",
        "JPG is universally supported across all platforms and browsers",
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
              Processing complete
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
              {result.filename} • Quality: {quality}%
            </p>
          </div>
        </div>
        <button
          onClick={downloadResult}
          className="btn-cyan"
          style={{ padding: "12px 20px" }}
        >
          <Download size={18} />
          Download JPG
        </button>
      </div>
      <PostProcessingActions
        file={result.blob}
        filename={result.filename}
        onReset={reset}
      />
    </div>
  );

  const footer = (
    <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
      Files are processed securely and deleted after conversion. No permanent storage.
    </p>
  );

  return (
    <>
      <Navbar />
      <UnifiedToolPage
        toolId="webp-to-jpg"
        header={header}
        upload={upload}
        controls={controls}
        action={action}
        instructions={instructions}
        result={resultPanel}
        footer={footer}
        showFooterMessage={false}
      />
    </>
  );
}
