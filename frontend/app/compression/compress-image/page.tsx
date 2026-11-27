"use client";

import { useState } from "react";
import { Image as ImageIcon, Settings } from "lucide-react";
import Navbar from "@/components/Navbar";
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
} from "@/components/compression/CompressionUpload";
import {
  compressImageToTarget,
  compressJpg,
  compressPng,
  compressWebp,
  type CompressionResult,
} from "@/utils/api";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPT = ".jpg,.jpeg,.png,.webp";

const breadcrumbItems = [
  { name: "Compression Tools", href: "/compression" },
  { name: "Compress Image", href: "/compression/compress-image" },
];

const QUALITY_OPTIONS = [
  { value: "low", label: "Low", description: "Smallest file, best for strict upload limits" },
  { value: "recommended", label: "Recommended", description: "Balanced size and visual quality" },
  { value: "high", label: "High", description: "Maximum quality with moderate size reduction" },
];

const QUALITY_VALUES: Record<string, number> = {
  low: 45,
  recommended: 70,
  high: 88,
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function imageFormat(name: string): "jpg" | "png" | "webp" {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "jpeg" || ext === "jpg") return "jpg";
  if (ext === "webp") return "webp";
  return "png";
}

export default function CompressImagePage() {
  const [quality, setQuality] = useState("recommended");
  const [targetKb, setTargetKb] = useState<number | null>(100);
  const [compressing, setCompressing] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);

  const validateFile = (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return "Please select a JPG, PNG or WEBP image.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`;
    }
    return null;
  };

  const {
    files,
    dragActive,
    setDragActive,
    addFiles,
    error,
    setError,
    inputRef,
    dropZoneProps,
    clearFiles,
  } = useCompressionUpload({
    accept: ACCEPT,
    maxSize: MAX_FILE_SIZE,
    validateFile,
    onFilesChange: (newFiles) => {
      if (newFiles.length === 0) setResult(null);
    },
  });

  const file = files[0];

  const compress = async () => {
    if (!file) return;
    setCompressing(true);
    setError(null);
    setResult(null);
    try {
      const format = imageFormat(file.file.name);
      const compressed = targetKb
        ? await compressImageToTarget(file.file, targetKb, format)
        : format === "jpg"
          ? await compressJpg(file.file, { quality: QUALITY_VALUES[quality] })
          : format === "webp"
            ? await compressWebp(file.file, { mode: "lossy", quality: QUALITY_VALUES[quality] })
            : await compressPng(file.file, { mode: "optimized", useOxipng: true });
      setResult(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compression failed. Please try again.");
    } finally {
      setCompressing(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    clearFiles();
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const header = (
    <UnifiedToolHeader
      breadcrumbs={breadcrumbItems}
      backHref="/compression"
      icon={<ImageIcon size={28} strokeWidth={2} />}
      title="Compress Image"
      description="Pick a target size or quality level, upload your image and download the result. No login, no watermark."
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
          label="Drag & drop a JPG, PNG or WEBP image"
          subLabel="or click to browse (max 50 MB)"
          icon={<ImageIcon size={48} style={{ color: "var(--primary-teal)" }} />}
          accept={ACCEPT}
          onFileSelect={(files) => addFiles(files ?? [])}
          disabled={compressing}
          dragActive={dragActive}
          setDragActive={setDragActive}
        />
      </div>
      {file && (
        <FilePreview file={file} index={0} onRemove={reset} compressing={compressing} />
      )}
      <ErrorDisplay error={error} />
    </>
  );

  const controls = (
    <div>
      <div className="zd-tool-options-title">
        <Settings size={17} />
        <h2>Compression Settings</h2>
      </div>
      <div className="zd-tool-options-grid">
        <div className="zd-tool-option-full">
          <span className="zd-tool-option-label">Target size presets</span>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[100, 200, 500].map((preset) => {
              const selected = targetKb === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTargetKb(selected ? null : preset)}
                  disabled={compressing}
                  aria-pressed={selected}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: `2px solid ${selected ? "var(--primary-teal)" : "var(--border)"}`,
                    background: selected ? "var(--teal-light)" : "var(--bg-card)",
                    color: selected ? "var(--primary-teal)" : "var(--text-secondary)",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: compressing ? "not-allowed" : "pointer",
                    opacity: compressing ? 0.5 : 1,
                  }}
                >
                  {preset} KB
                </button>
              );
            })}
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 10px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                fontSize: "13px",
                color: "var(--text-secondary)",
              }}
            >
              Custom
              <input
                type="number"
                min={1}
                max={10240}
                placeholder="KB"
                value={targetKb && ![100, 200, 500].includes(targetKb) ? targetKb : ""}
                onChange={(event) => {
                  const parsed = Number(event.target.value);
                  setTargetKb(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
                }}
                disabled={compressing}
                style={{
                  width: "72px",
                  padding: "6px 8px",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  background: "var(--editor-workspace)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                }}
              />
            </label>
          </div>
          {targetKb && (
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
              ZipDrop will try several settings and return the smallest usable file at or near {targetKb} KB.
            </p>
          )}
        </div>
        {!targetKb && (
          <div className="zd-tool-option-full">
            <span className="zd-tool-option-label">Compression quality</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {QUALITY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px 16px",
                    background: quality === opt.value ? "var(--teal-light)" : "var(--bg-card)",
                    border: quality === opt.value ? "1px solid rgba(7,140,145,0.24)" : "1px solid var(--border)",
                    borderRadius: "10px",
                    cursor: compressing ? "not-allowed" : "pointer",
                    opacity: compressing ? 0.5 : 1,
                  }}
                >
                  <input
                    type="radio"
                    name="compression-Compression-quality"
                    value={opt.value}
                    checked={quality === opt.value}
                    onChange={() => setQuality(opt.value)}
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
        )}
      </div>
    </div>
  );

  const action = (
    <ToolActionButton
      onClick={compress}
      disabled={compressing || !file}
      loading={compressing}
      loadingText="Compressing…"
      icon={<ImageIcon size={20} />}
    >
      Compress Image
    </ToolActionButton>
  );

  const instructions = (
    <>
      <ToolInfoBlock
        title="Compression Options"
        items={[
          "Target Size: Set exact KB limit (100, 200, 500 KB, or custom)",
          "Quality Level: Low (smallest), Recommended (balanced), High (best quality)",
          "Supports JPG, PNG, and WEBP formats",
          "Maximum file size: 50 MB",
        ]}
        variant="notes"
      />
      <ToolInfoBlock
        title="How it works"
        items={[
          "Target size mode tries multiple quality levels to hit your KB limit",
          "Quality mode uses fixed quality settings per format",
          "PNG uses optimized compression with oxipng when available",
          "JPG uses progressive encoding for web display",
          "WEBP uses lossy compression with adjustable quality",
        ]}
        variant="notes"
      />
    </>
  );

  const privacy = (
    <ToolInfoBlock
      title="Privacy & Security"
      items={[
        "Images are processed securely and returned to your browser",
        "No permanent storage",
        "Files are not shared with third parties",
      ]}
      variant="privacy"
    />
  );

  const resultPanel = result && (
    <>
      <SuccessDisplay
        originalSize={result.stats.originalSize}
        compressedSize={result.stats.compressedSize}
        bytesSaved={result.stats.bytesSaved}
        reductionPercent={result.stats.reductionPercent}
        format={file ? imageFormat(file.file.name).toUpperCase() : "IMAGE"}
        fileName={result.filename}
        resultFile={result.blob}
        onDownload={downloadResult}
        onReset={reset}
        downloadLabel="Download Image"
        formatBytes={formatBytes}
        compressionMethod={result.stats.method}
        warning={result.stats.warning}
        fallbackUsed={result.stats.fallbackUsed}
        targetAchieved={result.stats.targetAchieved}
        level={targetKb ? `Target ${targetKb} KB` : quality}
      />
    </>
  );

  const footer = (
    <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
      Images are processed securely and returned to your browser. No permanent storage.
    </p>
  );

  return (
    <>
      <Navbar />
      <UnifiedToolPage
        toolId="compress-image"
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