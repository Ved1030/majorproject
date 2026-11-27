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
import { compressPng } from "../../../utils/api";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const TOOL_NAME = "Compress PNG";
const TOOL_DESCRIPTION = "Reduce PNG file size with lossless or optimized compression";
const CATEGORY = "COMPRESSION TOOLS";
const ACCEPT = ".png";
const FILE_TYPE_LABEL = "PNG image";

const breadcrumbItems = [
  { name: "Compression Tools", href: "/compression" },
  { name: "Compress PNG", href: "/compression/png" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CompressPngPage() {
  const [mode, setMode] = useState<"lossless" | "optimized">("lossless");
  const [useOxipng, setUseOxipng] = useState(true);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    blob: Blob;
    filename: string;
    stats: any;
  } | null>(null);

  const validateFile = (f: File) => {
    if (f.type !== "image/png" && !f.name.toLowerCase().endsWith(".png")) {
      return "Please select a PNG file.";
    }
    if (f.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`;
    }
    return null;
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

      const result = await compressPng(file.file, {
        mode,
        useOxipng,
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
    { value: "lossless", label: "Lossless", description: "Preserves pixel data exactly — guaranteed identical output (uses oxipng when available)" },
    { value: "optimized", label: "Optimized", description: "Allows palette optimization — may reduce colors but smaller files" },
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
          label="Drag & drop a PNG file"
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
                  onChange={(v) => setMode(v.target.value as "lossless" | "optimized")}
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
            Lossless mode guarantees identical pixel data. Optimized mode may reduce color count for smaller files.
          </p>
        </div>
        <div className="zd-tool-option-full">
          <div className="zd-tool-check-row">
            <label
              htmlFor="png-use-oxipng"
              style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: compressing || mode !== "lossless" ? "not-allowed" : "pointer", opacity: compressing || mode !== "lossless" ? 0.5 : 1 }}
            >
              <input
                id="png-use-oxipng"
                type="checkbox"
                checked={useOxipng}
                onChange={(e) => setUseOxipng(e.target.checked)}
                disabled={compressing || mode !== "lossless"}
                style={{ width: "18px", height: "18px", accentColor: "var(--primary-teal)", marginTop: "2px", flexShrink: 0 }}
              />
              <span>
                <span style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>Use oxipng for lossless optimization</span>
                <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Provides better lossless compression than Pillow alone (if available on server)
                </span>
              </span>
            </label>
          </div>
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
      Compress PNG
    </ToolActionButton>
  );

  const instructions = (
    <>
      <ToolInfoBlock
        title="Notes"
        items={[
          "Transparency and alpha channel are always preserved",
          "Lossless mode guarantees pixel-perfect output",
          "Optimized mode may reduce color palette (256 colors max) for smaller files",
          "oxipng provides better lossless compression when available on server",
        ]}
        variant="notes"
      />
      <ToolInfoBlock
        title="Compression Modes"
        items={[
          "Lossless: Preserves exact pixel data — identical output",
          "Optimized: May reduce colors for smaller files",
          "oxipng: Provides better lossless compression when available",
        ]}
        variant="notes"
      />
      <ToolInfoBlock
        title="Compression Notes"
        items={[
          "Transparency and alpha channel are always preserved",
          "Lossless mode guarantees pixel-perfect output",
          "Optimized mode may reduce color palette (256 colors max) for smaller files",
          "oxipng provides better lossless compression when available on server",
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
      format="PNG"
      fileName={result.filename}
      resultFile={result.blob}
      onDownload={downloadResult}
      onReset={reset}
      downloadLabel="Download PNG"
      formatBytes={formatBytes}
      compressionMethod={result.stats.method}
      warning={result.stats.warning}
      fallbackUsed={result.stats.fallbackUsed}
      extraStats={
        result.stats.width && result.stats.height && (
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
            {result.stats.width} × {result.stats.height} • Mode: {mode} • Method: {result.stats.method || "pillow"}
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
        toolId="compress-png"
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