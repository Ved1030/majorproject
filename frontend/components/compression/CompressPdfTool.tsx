"use client";

import { useState } from "react";
import { FileText, Loader2, Settings } from "lucide-react";
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
  toolId = "compress-pdf",
}: {
  defaultTargetKb?: number | null;
  toolId?: string;
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

  const header = (
    <UnifiedToolHeader
      breadcrumbs={breadcrumbItems}
      backHref="/compression"
      icon={<FileText size={28} strokeWidth={2} />}
      title="Compress PDF"
      description="Use the 100 KB, 200 KB or 500 KB preset for exam and college uploads, or choose Low, Recommended and High compression. No login and no watermark."
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
          label="Drag & drop a PDF file"
          subLabel="or click to browse (max 100 MB)"
          icon={<FileText size={48} style={{ color: "var(--primary-teal)" }} />}
          accept={ACCEPT}
          onFileSelect={(files) => addFiles(files ?? [])}
          disabled={compressing}
          dragActive={dragActive}
          setDragActive={setDragActive}
        />
      </div>
      {file && <FilePreview file={file} index={0} onRemove={reset} compressing={compressing} />}
      <ErrorDisplay error={error} />
    </>
  );

  const controls = (
    <div>
      <div className="zd-tool-options-title">
        <Settings size={17} />
        <h2>Target Size & Compression Level</h2>
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
        <div className="zd-tool-option-full">
          <span className="zd-tool-option-label">Compression Level</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {levelOptions.map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "12px 16px",
                  background: level === opt.value ? "var(--teal-light)" : "var(--bg-card)",
                  border: level === opt.value ? "1px solid rgba(7,140,145,0.24)" : "1px solid var(--border)",
                  borderRadius: "10px",
                  cursor: compressing ? "not-allowed" : "pointer",
                  opacity: compressing ? 0.5 : 1,
                }}
              >
                <input
                  type="radio"
                  name="compression-Compression-Level"
                  value={opt.value}
                  checked={level === opt.value}
                  onChange={() => setLevel(opt.value as "low" | "medium" | "high")}
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
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
            Higher compression may reduce quality of embedded images. Already-optimized PDFs may see little reduction.
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
      icon={<FileText size={20} />}
      loadingIcon={<Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />}
    >
      Compress PDF
    </ToolActionButton>
  );

  const instructions = (
    <ToolInfoBlock
      title="Compression Notes"
      items={[
        "Low: Target 10–35% reduction — preserves visual quality, text, vectors, links",
        "Recommended: Target 35–75% reduction — downsamples images, optimizes JPEG encoding",
        "High: Target 75–100% reduction — aggressive downsampling, lower JPEG quality",
        "Files under 10 KB are returned unchanged — further compression not possible",
        "Password-protected PDFs cannot be compressed",
      ]}
      variant="notes"
    />
  );

  const privacy = (
    <ToolInfoBlock
      title="Privacy & Security"
      items={[
        "Files are processed securely and deleted after compression",
        "No permanent storage of your documents",
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
        format="PDF"
        fileName={result.filename}
        resultFile={result.blob}
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
    </>
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
        toolId={toolId}
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