"use client";

import { useState } from "react";
import { Image, Loader2, Settings } from "lucide-react";
import Navbar from "../../../components/Navbar";
import UnifiedToolPage from "@/components/tool/UnifiedToolPage";
import UnifiedToolHeader from "@/components/tool/UnifiedToolHeader";
import ToolInfoBlock from "@/components/tool/ToolInfoBlock";
import ToolUploadArea from "@/components/tool/ToolUploadArea";
import ToolActionButton from "@/components/tool/ToolActionButton";
import {
  useCompressionUpload,
  FilePreview,
  ErrorDisplay,
  SuccessDisplay,
} from "../../../components/compression/CompressionUpload";
import { compressWebp } from "../../../utils/api";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const TOOL_NAME = "Compress WEBP";
const TOOL_DESCRIPTION = "Reduce WEBP file size with lossy or lossless compression";
const CATEGORY = "COMPRESSION TOOLS";
const ACCEPT = ".webp";
const FILE_TYPE_LABEL = "WEBP image";

const breadcrumbItems = [
  { name: "Compression Tools", href: "/compression" },
  { name: "Compress WEBP", href: "/compression/webp" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CompressWebpPage() {
  const [mode, setMode] = useState<"lossy" | "lossless">("lossy");
  const [qualityPreset, setQualityPreset] = useState<"high" | "balanced" | "smaller" | "custom">("balanced");
  const [customQuality, setCustomQuality] = useState(80);
  const [allowAnimated, setAllowAnimated] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    blob: Blob;
    filename: string;
    stats: any;
  } | null>(null);

  const validateFile = (f: File) => {
    if (f.type !== "image/webp" && !f.name.toLowerCase().endsWith(".webp")) {
      return "Please select a WEBP file.";
    }
    if (f.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`;
    }
    return null;
  };

  const getQualityValue = () => {
    if (mode === "lossless") return 100;
    if (qualityPreset === "custom") return customQuality;
    const presets = { high: 90, balanced: 80, smaller: 65 };
    return presets[qualityPreset];
  };

  const { files, dragActive, setDragActive, addFiles, error, setError, inputRef, dropZoneProps, handleFileSelect, removeFile, clearFiles } = useCompressionUpload({
    accept: ACCEPT,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    validateFile,
    onFilesChange: (newFiles) => {
      if (newFiles.length === 0) {
        setResult(null);
      }
    },
  });

  const file = files[0];

  const compress = async () => {
    if (!file) return;
    setCompressing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 15, 90));
      }, 300);

      const result = await compressWebp(file.file, {
        mode,
        quality: getQualityValue(),
        allowAnimated,
      });

      clearInterval(progressInterval);
      setProgress(100);

      setResult({
        blob: result.blob,
        filename: result.filename,
        stats: result.stats,
      });
    } catch (err: any) {
      setError(err.message || "Compression failed. Please try again.");
    } finally {
      setCompressing(false);
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
    clearFiles();
    setResult(null);
    setError(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const modeOptions = [
    { value: "lossless", label: "Lossless", description: "Preserves exact pixel data — no quality loss" },
    { value: "lossy", label: "Lossy", description: "Smaller files with adjustable quality — some quality loss" },
  ];

  const qualityOptions = [
    { value: "high", label: "High Quality", description: "Quality 90 — minimal visible loss" },
    { value: "balanced", label: "Balanced", description: "Quality 80 — good balance of size and quality" },
    { value: "smaller", label: "Smaller File", description: "Quality 65 — noticeable size reduction" },
    { value: "custom", label: "Custom Quality", description: "Set your own quality (1-95)" },
  ];

  const header = (
    <UnifiedToolHeader
      breadcrumbs={breadcrumbItems}
      backHref="/compression"
      icon={<Image size={28} strokeWidth={2} />}
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
        onChange={dropZoneProps.onChange}
        disabled={compressing}
      />
      <div className="zd-tool-drop-wrap">
        <ToolUploadArea
          label="Drag & drop a WEBP file"
          subLabel="or click to browse (max 50 MB)"
          icon={<Image size={48} style={{ color: "var(--primary-teal)" }} />}
          accept={ACCEPT}
          onFileSelect={(files) => addFiles(files ?? [])}
          disabled={compressing}
          dragActive={dragActive}
          setDragActive={setDragActive}
        />
      </div>
      {file && (
        <FilePreview
          file={file}
          index={0}
          onRemove={reset}
          compressing={compressing}
        />
      )}
      <ErrorDisplay error={error} />
    </>
  );

  const controls = (
    <>
      <div>
        <div className="zd-tool-options-title">
          <Settings size={17} />
          <h2>Compression Mode</h2>
        </div>
        <div className="zd-tool-options-grid">
          <div className="zd-tool-option-full">
            <span className="zd-tool-option-label">Compression Mode</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {modeOptions.map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px 16px",
                    background: mode === opt.value ? "var(--teal-light)" : "var(--bg-card)",
                    border: mode === opt.value ? "1px solid rgba(7,140,145,0.24)" : "1px solid var(--border)",
                    borderRadius: "10px",
                    cursor: compressing ? "not-allowed" : "pointer",
                    opacity: compressing ? 0.5 : 1,
                  }}
                >
                  <input
                    type="radio"
                    name="compression-Compression-Mode"
                    value={opt.value}
                    checked={mode === opt.value}
                    onChange={(v) => setMode(v.target.value as "lossy" | "lossless")}
                    disabled={compressing}
                    style={{ width: "18px", height: "18px", accentColor: "var(--primary-teal)", marginTop: "2px", flexShrink: 0 }}
                  />
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{opt.label}</span>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{opt.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      {mode === "lossy" && (
        <div>
          <div className="zd-tool-options-title">
            <Settings size={17} />
            <h2>Quality Settings</h2>
          </div>
          <div className="zd-tool-options-grid">
            <div className="zd-tool-option-full">
              <span className="zd-tool-option-label">Quality Preset</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {qualityOptions.map((opt) => (
                  <label
                    key={opt.value}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "12px 16px",
                      background: qualityPreset === opt.value ? "var(--teal-light)" : "var(--bg-card)",
                      border: qualityPreset === opt.value ? "1px solid rgba(7,140,145,0.24)" : "1px solid var(--border)",
                      borderRadius: "10px",
                      cursor: compressing ? "not-allowed" : "pointer",
                      opacity: compressing ? 0.5 : 1,
                    }}
                  >
                    <input
                      type="radio"
                      name="compression-Quality-Preset"
                      value={opt.value}
                      checked={qualityPreset === opt.value}
                      onChange={(v) => setQualityPreset(v.target.value as "high" | "balanced" | "smaller" | "custom")}
                      disabled={compressing}
                      style={{ width: "18px", height: "18px", accentColor: "var(--primary-teal)", marginTop: "2px", flexShrink: 0 }}
                    />
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{opt.label}</span>
                      <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{opt.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {qualityPreset === "custom" && (
              <div className="zd-tool-option-full zd-tool-quality-row">
                <div className="zd-tool-quality-control">
                  <label className="zd-tool-option-label" htmlFor="webp-custom-quality">Quality</label>
                  <input
                    id="webp-custom-quality"
                    type="range"
                    min={1}
                    max={95}
                    value={customQuality}
                    onChange={(e) => setCustomQuality(parseInt(e.target.value))}
                    disabled={compressing}
                    style={{ accentColor: "var(--primary-teal)" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "10px", color: "var(--text-muted)" }}>
                    {[{ value: 1, label: "Low" }, { value: 50, label: "Medium" }, { value: 95, label: "High" }].map((mark) => (
                      <span key={mark.value}>{mark.label}</span>
                    ))}
                  </div>
                </div>
                <span className="zd-tool-quality-value">{customQuality}</span>
              </div>
            )}
          </div>
        </div>
      )}
      <div>
        <div className="zd-tool-options-title">
          <Settings size={17} />
          <h2>Advanced Options</h2>
        </div>
        <div className="zd-tool-options-grid">
          <div className="zd-tool-option-full zd-tool-check-row">
            <label
              htmlFor="webp-allow-animated"
              style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: compressing ? "not-allowed" : "pointer", opacity: compressing ? 0.5 : 1 }}
            >
              <input
                id="webp-allow-animated"
                type="checkbox"
                checked={allowAnimated}
                onChange={(e) => setAllowAnimated(e.target.checked)}
                disabled={compressing}
                style={{ width: "18px", height: "18px", accentColor: "var(--primary-teal)", marginTop: "2px", flexShrink: 0 }}
              />
              <span>
                <span style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>Allow animated WEBP</span>
                <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Process animated WEBP files (uses first frame only). Unchecked = reject animated files.
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>
    </>
  );

  const action = (
    <ToolActionButton
      onClick={compress}
      disabled={compressing || !file}
      loading={compressing}
      loadingText={`Compressing... ${progress}%`}
      icon={<Image size={20} />}
      loadingIcon={<Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />}
    >
      Compress WEBP
    </ToolActionButton>
  );

  const instructions = (
    <>
      <ToolInfoBlock
        title="Notes"
        items={[
          "Transparency is preserved in both lossy and lossless modes",
          "Animated WEBP files use first frame only (when enabled)",
          "Lossless mode preserves exact pixel data",
          "Lossy mode provides smaller files with adjustable quality",
        ]}
        variant="notes"
      />
      <ToolInfoBlock
        title="Compression Modes"
        items={[
          "Lossless: Preserves exact pixel data — no quality loss",
          "Lossy: Smaller files with adjustable quality (1-95)",
          "Quality presets: High (90), Balanced (80), Smaller (65), Custom",
          "Animated WEBP: Process animated files using first frame only",
        ]}
        variant="notes"
      />
      <ToolInfoBlock
        title="Compression Notes"
        items={[
          "Transparency is preserved in both lossy and lossless modes",
          "Animated WEBP files use first frame only (when enabled)",
          "Lossless mode preserves exact pixel data",
          "Lossy mode provides smaller files with adjustable quality",
        ]}
        variant="notes"
      />
    </>
  );

  const privacy = (
    <ToolInfoBlock
      title="Privacy & Security"
      items={[
        "Files are processed securely and deleted after compression",
        "No permanent storage of your images",
        "Files are not shared with third parties",
      ]}
      variant="privacy"
    />
  );

  const resultPanel = result && (
    <SuccessDisplay
      originalSize={result.stats.originalSize}
      compressedSize={result.stats.compressedSize}
      bytesSaved={result.stats.bytesSaved}
      reductionPercent={result.stats.reductionPercent}
      format="WEBP"
      fileName={result.filename}
      onDownload={downloadResult}
      onReset={reset}
      downloadLabel="Download WEBP"
      formatBytes={formatBytes}
      compressionMethod={result.stats.method}
      warning={result.stats.warning}
      fallbackUsed={result.stats.fallbackUsed}
      extraStats={
        result.stats.width && result.stats.height && (
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
            {result.stats.width} × {result.stats.height} • Mode: {mode} • Quality: {getQualityValue()}
          </p>
        )
      }
    />
  );

  const footer = (
    <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
      Files are processed securely and deleted after compression. No permanent storage.
    </p>
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
        footer={footer}
        showFooterMessage={false}
      />
    </>
  );
}