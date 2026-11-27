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
import { compressJpg } from "../../../utils/api";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const TOOL_NAME = "Compress JPG";
const TOOL_DESCRIPTION = "Reduce JPG file size with adjustable quality settings";
const CATEGORY = "COMPRESSION TOOLS";
const ACCEPT = ".jpg,.jpeg";
const FILE_TYPE_LABEL = "JPG image";

const breadcrumbItems = [
  { name: "Compression Tools", href: "/compression" },
  { name: "Compress JPG", href: "/compression/jpg" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CompressJpgPage() {
  const [qualityPreset, setQualityPreset] = useState<"high" | "balanced" | "smaller" | "custom">("balanced");
  const [customQuality, setCustomQuality] = useState(80);
  const [progressive, setProgressive] = useState(true);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    blob: Blob;
    filename: string;
    stats: any;
  } | null>(null);

  const validateFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!ext || !['jpg', 'jpeg'].includes(ext)) {
      return "Please select a JPG/JPEG file.";
    }
    if (f.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`;
    }
    return null;
  };

  const getQualityValue = () => {
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

      const result = await compressJpg(file.file, {
        quality: getQualityValue(),
        progressive,
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
          label="Drag & drop a JPG file"
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
              <label className="zd-tool-option-label" htmlFor="jpg-custom-quality">Quality</label>
              <input
                id="jpg-custom-quality"
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
        <div className="zd-tool-option-full">
          <div className="zd-tool-check-row">
            <label
              htmlFor="jpg-progressive"
              style={{ display: "inline-flex", alignItems: "center", gap: "10px", cursor: compressing ? "not-allowed" : "pointer", opacity: compressing ? 0.5 : 1 }}
            >
              <input
                id="jpg-progressive"
                type="checkbox"
                checked={progressive}
                onChange={(e) => setProgressive(e.target.checked)}
                disabled={compressing}
                style={{ width: "18px", height: "18px", accentColor: "var(--primary-teal)" }}
              />
              <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>Progressive JPEG</span>
            </label>
          </div>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", marginLeft: "28px" }}>
            Loads in passes — better for web display
          </p>
        </div>
      </div>
    </div>
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
      Compress JPG
    </ToolActionButton>
  );

  const instructions = (
    <>
      <ToolInfoBlock
        title="Notes"
        items={[
          "EXIF orientation is automatically corrected",
          "ICC color profiles are preserved when possible",
          "Transparency is not supported in JPG — transparent areas become white",
          "Progressive JPEG loads gradually in browsers",
        ]}
        variant="notes"
      />
      <ToolInfoBlock
        title="Quality Settings"
        items={[
          "High Quality (90): Minimal visible loss, larger file",
          "Balanced (80): Good balance of size and quality",
          "Smaller File (65): Noticeable size reduction",
          "Custom (1-95): Set your own quality level",
          "Progressive JPEG: Loads gradually in browsers",
        ]}
        variant="notes"
      />
      <ToolInfoBlock
        title="Compression Notes"
        items={[
          "EXIF orientation is automatically corrected",
          "ICC color profiles are preserved when possible",
          "Transparency is not supported in JPG — transparent areas become white",
          "Progressive JPEG loads gradually in browsers",
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
      format="JPG"
      fileName={result.filename}
      resultFile={result.blob}
      onDownload={downloadResult}
      onReset={reset}
      downloadLabel="Download JPG"
      formatBytes={formatBytes}
      compressionMethod={result.stats.method}
      warning={result.stats.warning}
      fallbackUsed={result.stats.fallbackUsed}
      extraStats={
        result.stats.width && result.stats.height && (
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
            {result.stats.width} × {result.stats.height} • Quality: {getQualityValue()} • {result.stats.progressive ? "Progressive" : "Baseline"}
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
        toolId="compress-jpg"
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