"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
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
  InfoBox,
  InfoItem,
} from "@/components/compression/CompressionSettings";
import TargetSizePresets from "@/components/compression/TargetSizePresets";
import { ShareProcessedFileButton } from "@/components/seo/ProcessedFileShareCta";
import {
  compressPdf,
  compressPdfToTarget,
  type CompressionResult,
} from "@/utils/api";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const CATEGORY = "COMPRESSION TOOLS";
const ACCEPT = ".pdf";

const breadcrumbItems = [
  { name: "Compression Tools", href: "/compression" },
  { name: "Compress PDF", href: "/compression/pdf" },
];

const levelOptions = [
  { value: "low", label: "Low", description: "Target 10–35% reduction — preserve visual quality, text, vectors, links" },
  { value: "medium", label: "Recommended", description: "Target 35–75% reduction — downsample images, optimize JPEG encoding" },
  { value: "high", label: "High", description: "Target 75–100% reduction — aggressive downsampling, lower JPEG quality" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CompressPdfTool({
  defaultTargetKb = null,
}: {
  defaultTargetKb?: number | null;
}) {
  const [level, setLevel] = useState<"low" | "medium" | "high">("medium");
  const [targetKb, setTargetKb] = useState<number | null>(defaultTargetKb);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CompressionResult | null>(null);

  const validateFile = (f: File) => {
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      return "Please select a PDF file.";
    }
    if (f.size > MAX_FILE_SIZE) {
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
    multiple: false,
    validateFile,
    onFilesChange: (newFiles) => {
      if (newFiles.length === 0) setResult(null);
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
        setProgress((p) => Math.min(p + 10, 90));
      }, 500);

      const compressed = targetKb
        ? await compressPdfToTarget(file.file, targetKb)
        : await compressPdf(file.file, { level });

      clearInterval(progressInterval);
      setProgress(100);
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
    setProgress(0);
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
              <span className="section-label">{CATEGORY}</span>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
                Compress PDF Under 100KB &amp; 200KB Online Free (No Watermark)
              </h1>
              <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--text-secondary)", margin: "8px 0 0", maxWidth: "620px" }}>
                Use the 100 KB, 200 KB or 500 KB preset for exam and college uploads, or choose Low, Recommended and High compression. No login and no watermark.
              </p>
            </div>
          </div>

          <div className="glass-card" style={{ padding: "clamp(24px, 3vh, 32px)" }}>
            <CompressionSettingsPanel title="Target Size &amp; Compression Level">
              <TargetSizePresets value={targetKb} onChange={setTargetKb} disabled={compressing} />
              <CompressionRadioGroup
                label="Compression Level"
                value={level}
                onChange={(v: string) => setLevel(v as "low" | "medium" | "high")}
                options={levelOptions}
                disabled={compressing}
                helperText="Higher compression may reduce quality of embedded images. Already-optimized PDFs may see little reduction."
              />
            </CompressionSettingsPanel>

            <CompressionUploadZone
              {...dropZoneProps}
              dragActive={dragActive}
              compressing={compressing}
              label="Drag & drop a PDF file"
              subLabel="or click to browse (max 100 MB)"
              icon={<FileText size={48} />}
            />

            {file && <FilePreview file={file} index={0} onRemove={reset} compressing={compressing} />}

            <ErrorDisplay error={error} />

            <button
              onClick={compress}
              disabled={compressing || !file}
              className="btn-cyan"
              style={{ width: "100%", padding: "16px 24px", fontSize: "15px", fontWeight: 700 }}
            >
              {compressing ? (
                <>
                  <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                  Compressing... {progress}%
                </>
              ) : (
                <>
                  <FileText size={20} />
                  Compress PDF
                </>
              )}
            </button>

            {result && (
              <SuccessDisplay
                originalSize={result.stats.originalSize}
                compressedSize={result.stats.compressedSize}
                bytesSaved={result.stats.bytesSaved}
                reductionPercent={result.stats.reductionPercent}
                format="PDF"
                fileName={result.filename}
                onDownload={downloadResult}
                onReset={reset}
                downloadLabel="Download PDF"
                formatBytes={formatBytes}
                compressionMethod={result.stats.method}
                warning={result.stats.warning}
                fallbackUsed={result.stats.fallbackUsed}
                targetAchieved={result.stats.targetAchieved}
                level={level}
                extraStats={
                  result.stats.pageCount ? (
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                      {result.stats.pageCount} page{result.stats.pageCount !== 1 ? "s" : ""} • {targetKb ? `Target: ${targetKb} KB` : `Level: ${level}`}
                    </p>
                  ) : undefined
                }
              />
            )}

            {result && (
              <ShareProcessedFileButton
                file={new File([result.blob], result.filename, { type: result.blob.type || "application/pdf" })}
              />
            )}

            <InfoBox>
              <InfoItem>Low: Target 10–35% reduction — preserves visual quality, text, vectors, links</InfoItem>
              <InfoItem>Recommended: Target 35–75% reduction — downsamples images, optimizes JPEG encoding</InfoItem>
              <InfoItem>High: Target 75–100% reduction — aggressive downsampling, lower JPEG quality</InfoItem>
              <InfoItem>Files under 10 KB are returned unchanged — further compression not possible</InfoItem>
              <InfoItem>Password-protected PDFs cannot be compressed</InfoItem>
            </InfoBox>
          </div>

          <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
            Files are processed securely and deleted after compression. No permanent storage.
          </p>
        </div>
      </div>
    </>
  );
}
