"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  useCompressionUpload,
  FilePreview,
  CompressionUploadZone,
  ErrorDisplay,
  SuccessDisplay,
} from "@/components/compression/CompressionUpload";
import {
  CompressionSettingsPanel,
  CompressionRadioGroup,
} from "@/components/compression/CompressionSettings";
import TargetSizePresets from "@/components/compression/TargetSizePresets";
import { ShareProcessedFileButton } from "@/components/seo/ProcessedFileShareCta";
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

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", background: "var(--bg-main)", padding: "clamp(24px, 4vh, 48px) 24px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
          <Breadcrumbs items={breadcrumbItems} />
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link href="/compression" style={{ textDecoration: "none", color: "var(--text-secondary)", padding: "8px" }}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <span className="section-label">COMPRESSION TOOLS</span>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
                Compress JPG, PNG &amp; WEBP Images to Exact KB Size Free
              </h1>
              <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--text-secondary)", margin: "8px 0 0" }}>
                Pick a target size or quality level, upload your image and download the result. No login, no watermark.
              </p>
            </div>
          </div>

          <div className="glass-card" style={{ padding: "clamp(24px, 3vh, 32px)" }}>
            <CompressionSettingsPanel title="Compression Settings">
              <TargetSizePresets value={targetKb} onChange={setTargetKb} disabled={compressing} />
              {!targetKb && (
                <CompressionRadioGroup
                  label="Compression quality"
                  value={quality}
                  onChange={setQuality}
                  options={QUALITY_OPTIONS}
                  disabled={compressing}
                />
              )}
            </CompressionSettingsPanel>

            <CompressionUploadZone
              {...dropZoneProps}
              dragActive={dragActive}
              compressing={compressing}
              label="Drag & drop a JPG, PNG or WEBP image"
              subLabel="or click to browse (max 50 MB)"
              icon={<ImageIcon size={48} />}
            />

            {file && (
              <FilePreview file={file} index={0} onRemove={reset} compressing={compressing} />
            )}

            <ErrorDisplay error={error} />

            <button
              onClick={compress}
              disabled={compressing || !file}
              className="btn-cyan"
              style={{ width: "100%", padding: "16px 24px", fontSize: "15px", fontWeight: 700 }}
            >
              {compressing ? "Compressing…" : "Compress Image"}
            </button>

            {result && (
              <>
                <SuccessDisplay
                  originalSize={result.stats.originalSize}
                  compressedSize={result.stats.compressedSize}
                  bytesSaved={result.stats.bytesSaved}
                  reductionPercent={result.stats.reductionPercent}
                  format={file ? imageFormat(file.file.name).toUpperCase() : "IMAGE"}
                  fileName={result.filename}
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
                <ShareProcessedFileButton
                  file={new File([result.blob], result.filename, { type: result.blob.type || "image/png" })}
                />
              </>
            )}
          </div>

          <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
            Images are processed securely and returned to your browser. No permanent storage.
          </p>
        </div>
      </div>
    </>
  );
}
