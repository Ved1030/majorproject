"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Image, Download, Loader2, AlertCircle, Check, X, RotateCcw, Eye, Maximize2, Minimize2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import { removeBackground, checkBackgroundRemoverHealth, BackgroundRemovalResult } from "@/utils/api";
import { ShareProcessedFileButton } from "@/components/seo/ProcessedFileShareCta";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPT_EXT = ".jpg,.jpeg,.png,.webp";

const TOOL_NAME = "Free AI Image Background Remover Online – Transparent PNG";
const TOOL_DESCRIPTION = "Remove image backgrounds automatically and download clean transparent PNG images.";
const CATEGORY = "IMAGE TOOLS";

const BACKGROUND_OPTIONS = [
  { id: "transparent", name: "Transparent", color: "transparent", pattern: true },
  { id: "white", name: "White", color: "#FFFFFF", pattern: false },
  { id: "black", name: "Black", color: "#000000", pattern: false },
  { id: "grey", name: "Light Grey", color: "#F0F0F0", pattern: false },
  { id: "gradient-1", name: "Blue Gradient", color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", pattern: false },
  { id: "gradient-2", name: "Sunset Gradient", color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", pattern: false },
  { id: "gradient-3", name: "Mint Gradient", color: "linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)", pattern: false },
];

const breadcrumbItems = [
  { name: "Image Tools", href: "/conversion?category=image-tools" },
  { name: "Background Remover", href: "/image-tools/background-remover" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileFormat(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'jpeg') return 'jpg';
  return ext || '';
}

interface BackgroundRemovalResultWithUrl extends BackgroundRemovalResult {
  objectUrl?: string;
}

interface UploadedFile {
  file: File;
  preview: string;
  originalName: string;
  size: number;
  format: string;
  width?: number;
  height?: number;
}

function ErrorDisplay({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div style={{
      marginTop: "16px",
      padding: "12px 16px",
      background: "rgba(239, 68, 68, 0.1)",
      border: "1px solid rgba(239, 68, 68, 0.3)",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      color: "#ef4444",
      fontSize: "13px",
    }}>
      <AlertCircle size={18} style={{ flexShrink: 0 }} />
      <span>{error}</span>
    </div>
  );
}

export default function BackgroundRemoverPage() {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<BackgroundRemovalResultWithUrl | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string>("transparent");
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPosition, setComparisonPosition] = useState(50);
  const [zoomedImage, setZoomedImage] = useState<"original" | "result" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const originalImgRef = useRef<HTMLImageElement>(null);
  const resultImgRef = useRef<HTMLImageElement>(null);

  const validateFile = useCallback((f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return "Unsupported file type. Please upload JPG, PNG, or WEBP.";
    }
    if (f.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`;
    }
    return null;
  }, []);

  const handleFileSelect = useCallback((newFile: File) => {
    const err = validateFile(newFile);
    if (err) {
      setError(err);
      return;
    }

    const preview = URL.createObjectURL(newFile);
    const img = document.createElement('img');
    img.src = preview;
    img.onload = () => {
      setFile({
        file: newFile,
        preview,
        originalName: newFile.name,
        size: newFile.size,
        format: getFileFormat(newFile),
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      setError(null);
      setResult(null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(preview);
      setError("Failed to load image. The file may be corrupted.");
    };
  }, [validateFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const triggerFileSelect = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  const removeFile = useCallback(() => {
    if (file?.preview) URL.revokeObjectURL(file.preview);
    if (result?.objectUrl) URL.revokeObjectURL(result.objectUrl);
    setFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [file, result]);

  const replaceFile = useCallback(() => {
    if (inputRef.current) inputRef.current.click();
  }, []);

  const processImage = async () => {
    if (!file || processing) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      const result = await removeBackground(file.file);
      
      const objectUrl = URL.createObjectURL(result.blob);
      setResult({ ...result, objectUrl });
    } catch (err: any) {
      setError(err.message || "Background removal failed. Please try again.");
    } finally {
      setProcessing(false);
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

  const openZoom = (type: "original" | "result") => {
    setZoomedImage(type);
  };

  const closeZoom = () => {
    setZoomedImage(null);
  };

  const getBackgroundStyle = (bg: typeof BACKGROUND_OPTIONS[0]): React.CSSProperties => {
    if (bg.pattern) {
      return {
        backgroundImage: `
          linear-gradient(45deg, #E8E8E8 25%, transparent 25%),
          linear-gradient(-45deg, #E8E8E8 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #E8E8E8 75%),
          linear-gradient(-45deg, transparent 75%, #E8E8E8 75%)
        `,
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
        backgroundColor: "#FFFFFF",
      };
    }
    if (typeof bg.color === "string" && bg.color.startsWith("linear-gradient")) {
      return { background: bg.color };
    }
    return { backgroundColor: bg.color as string };
  };

  if (!file) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: "100vh", background: "var(--bg-main)", padding: "clamp(24px, 4vh, 48px) 24px" }}>
          <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Breadcrumbs */}
            <Breadcrumbs items={breadcrumbItems} />

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Link href="/conversion?category=image-tools" style={{ textDecoration: "none", color: "var(--text-secondary)", padding: "8px" }}>
                <ArrowLeft size={20} />
              </Link>
              <div>
                <span className="section-label">{CATEGORY}</span>
                <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
                  {TOOL_NAME}
                </h1>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "clamp(24px, 3vh, 32px)" }}>
              <p style={{ fontSize: "15px", color: "var(--text-secondary)", marginBottom: "24px", lineHeight: 1.6 }}>
                {TOOL_DESCRIPTION}
              </p>

              <div
                className={`drag-zone ${dragActive ? "dragging" : ""}`}
                onClick={triggerFileSelect}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{ cursor: "pointer" }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT_EXT}
                  onChange={handleInputChange}
                  style={{
                    position: "absolute",
                    width: "1px",
                    height: "1px",
                    padding: "0",
                    margin: "-1px",
                    overflow: "hidden",
                    clip: "rect(0, 0, 0, 0)",
                    whiteSpace: "nowrap",
                    border: "0",
                  }}
                  tabIndex={-1}
                />
                <Image size={48} style={{ color: dragActive ? "var(--primary-teal)" : "var(--text-muted)", transition: "color 0.2s ease" }} />
                <p style={{
                  fontSize: "16px",
                  fontWeight: 500,
                  color: dragActive ? "var(--primary-teal)" : "var(--text-secondary)",
                  transition: "color 0.2s ease",
                  margin: 0,
                }}>
                  {dragActive ? "Release to upload" : "Drop an image here or click to browse"}
                </p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0" }}>
                  JPG, PNG, WEBP • Max 20 MB
                </p>
              </div>

              <ErrorDisplay error={error} />

              <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
                Files are processed securely and deleted after processing. No permanent storage.
</p>
            </div>
          </div>
        </div>
    </>
  );
}

  // Result view
  return (
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", background: "var(--bg-main)", padding: "clamp(24px, 4vh, 48px) 24px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} />

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/conversion?category=image-tools" style={{ textDecoration: "none", color: "var(--text-secondary)", padding: "8px" }}>
              <ArrowLeft size={20} />
            </Link>
            <div style={{ flex: 1, minWidth: 200 }}>
              <span className="section-label">{CATEGORY}</span>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
                {TOOL_NAME}
              </h1>
            </div>
            <button
              onClick={removeFile}
              className="btn-ghost"
              style={{ height: "40px" }}
            >
              <RotateCcw size={16} />
              New Image
            </button>
          </div>

          <div className="glass-card" style={{ padding: "clamp(24px, 3vh, 32px)", display: "flex", flexDirection: "column", gap: "24px" }}>
            {!result ? (
              // Uploaded file preview with process button
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: "12px",
                    overflow: "hidden",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    flexShrink: 0,
                  }}>
                    <img
                      src={file.preview}
                      alt={file.originalName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: "15px",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      margin: "0 0 4px",
                    }}>
                      {file.originalName}
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                      {file.format.toUpperCase()} • {formatBytes(file.size)} • {file.width}×{file.height}px
                    </p>
                  </div>
                  <button
                    onClick={replaceFile}
                    disabled={processing}
                    className="btn-ghost"
                    style={{ height: "40px" }}
                  >
                    <X size={16} />
                    Replace
                  </button>
                </div>

                <ErrorDisplay error={error} />

                <button
                  onClick={processImage}
                  disabled={processing}
                  className="btn-cyan"
                  style={{
                    width: "100%",
                    padding: "16px 24px",
                    fontSize: "15px",
                    fontWeight: 700,
                    opacity: processing ? 0.5 : 1,
                    cursor: processing ? "not-allowed" : "pointer",
                  }}
                >
                  <span className="shimmer" />
                  {processing ? (
                    <>
                      <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                      Removing background...
                    </>
                  ) : (
                    <>
                      <Image size={20} />
                      Remove Background
                    </>
                  )}
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "var(--editor-workspace)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "12px", color: "var(--text-secondary)" }}>
                  <Eye size={16} style={{ color: "var(--text-muted)" }} />
                  <span>
                    The AI automatically detects your image type (photo or graphic) and applies the best removal method. No settings needed.
                  </span>
                </div>
              </>
            ) : (
              // Result view
              <>
                <div className="divider" />
                
                {/* Background preview selector */}
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
                    Preview Background
                  </p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {BACKGROUND_OPTIONS.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setSelectedBackground(bg.id)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "8px",
                          border: `2px solid ${selectedBackground === bg.id ? "var(--primary-teal)" : "var(--border)"}`,
                          background: selectedBackground === bg.id ? "var(--teal-light)" : "var(--bg-card)",
                          color: selectedBackground === bg.id ? "var(--primary-teal)" : "var(--text-secondary)",
                          fontSize: "12px",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {bg.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comparison toggle */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)" }}>
                    <input
                      type="checkbox"
                      checked={showComparison}
                      onChange={(e) => setShowComparison(e.target.checked)}
                      style={{ width: "18px", height: "18px", accentColor: "var(--primary-teal)" }}
                    />
                    Show before/after comparison slider
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => openZoom("original")}
                      className="btn-ghost"
                      title="Zoom original"
                    >
                      <Maximize2 size={16} />
                    </button>
                    <button
                      onClick={() => openZoom("result")}
                      className="btn-ghost"
                      title="Zoom result"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Image previews */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {showComparison ? (
                    // Comparison slider
                    <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                      <div style={{ position: "relative", width: "100%", aspectRatio: file.width && file.height ? `${file.width}/${file.height}` : "auto", maxHeight: "600px" }}>
                        {/* Original */}
                        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                          <img
                            ref={originalImgRef}
                            src={file.preview}
                            alt="Original"
                            style={{ width: "100%", height: "100%", objectFit: "contain", ...getBackgroundStyle(BACKGROUND_OPTIONS.find(b => b.id === selectedBackground)!) }}
                          />
                        </div>
                        {/* Result */}
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${comparisonPosition}%`,
                            overflow: "hidden",
                            borderRight: "2px solid var(--primary-teal)",
                          }}
                        >
                          <img
                            ref={resultImgRef}
                            src={result.objectUrl || URL.createObjectURL(result.blob)}
                            alt="Background removed"
                            style={{ width: "100%", height: "100%", objectFit: "contain", ...getBackgroundStyle(BACKGROUND_OPTIONS.find(b => b.id === selectedBackground)!) }}
                          />
                        </div>
                        {/* Slider handle */}
                        <div
                          style={{
                            position: "absolute",
                            left: `calc(${comparisonPosition}% - 12px)`,
                            top: 0,
                            bottom: 0,
                            width: "24px",
                            background: "var(--primary-teal)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "ew-resize",
                            zIndex: 10,
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const handleMove = (moveEvent: MouseEvent) => {
                              const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                              const pos = ((moveEvent.clientX - rect.left) / rect.width) * 100;
                              setComparisonPosition(Math.max(0, Math.min(100, pos)));
                            };
                            const handleUp = () => {
                              document.removeEventListener("mousemove", handleMove);
                              document.removeEventListener("mouseup", handleUp);
                            };
                            document.addEventListener("mousemove", handleMove);
                            document.addEventListener("mouseup", handleUp);
                          }}
                        >
                          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
                            <polyline points="15 18 9 12 15 6"></polyline>
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </div>
                        {/* Labels */}
                        <div style={{ position: "absolute", top: 12, left: 12, zIndex: 5, background: "rgba(0,0,0,0.6)", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 500 }}>
                          Original
                        </div>
                        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 5, background: "rgba(7,140,145,0.9)", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 500 }}>
                          No Background
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Side by side
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                      <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg-card)", aspectRatio: file.width && file.height ? `${file.width}/${file.height}` : "auto", maxHeight: "500px" }}>
                        <img
                          ref={originalImgRef}
                          src={file.preview}
                          alt="Original"
                          style={{ width: "100%", height: "100%", objectFit: "contain", ...getBackgroundStyle(BACKGROUND_OPTIONS.find(b => b.id === selectedBackground)!) }}
                        />
                        <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(0,0,0,0.6)", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 500 }}>
                          Original
                        </div>
                        <button
                          onClick={() => openZoom("original")}
                          style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "8px", background: "rgba(255,255,255,0.9)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                          <Maximize2 size={18} />
                        </button>
                      </div>
                      <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg-card)", aspectRatio: file.width && file.height ? `${file.width}/${file.height}` : "auto", maxHeight: "500px" }}>
                        <div style={{ width: "100%", height: "100%", position: "relative", ...getBackgroundStyle(BACKGROUND_OPTIONS.find(b => b.id === selectedBackground)!) }}>
                          <img
                            ref={resultImgRef}
                            src={result.objectUrl || URL.createObjectURL(result.blob)}
                            alt="Background removed"
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                          />
                        </div>
                        <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(7,140,145,0.9)", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 500 }}>
                          No Background
                        </div>
                        <button
                          onClick={() => openZoom("result")}
                          style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "8px", background: "rgba(255,255,255,0.9)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                          <Maximize2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Download button */}
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button
                      onClick={downloadResult}
                      className="btn-cyan"
                      style={{
                        flex: 1,
                        minWidth: 200,
                        padding: "16px 24px",
                        fontSize: "15px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <Download size={20} />
                      Download Transparent PNG
                    </button>
                    <button
                      onClick={replaceFile}
                      className="btn-ghost"
                      style={{
                        flex: 1,
                        minWidth: 200,
                        padding: "16px 24px",
                        fontSize: "15px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <RotateCcw size={20} />
                      Replace Image
                    </button>
                  </div>

                  <ShareProcessedFileButton
                    file={new File([result.blob], result.filename, {
                      type: result.blob.type || "image/png",
                    })}
                  />
                </div>
              </>
            )}

            {/* Zoom modal */}
            {zoomedImage && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0, 0, 0, 0.95)",
                  zIndex: 1000,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "24px",
                }}
                onClick={closeZoom}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); closeZoom(); }}
                  style={{
                    position: "absolute",
                    top: "24px",
                    right: "24px",
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "24px",
                  }}
                >
                  <X size={24} />
                </button>
                <img
                  src={zoomedImage === "original" ? file.preview : (result?.objectUrl || URL.createObjectURL(result!.blob))}
                  alt={zoomedImage === "original" ? "Original" : "Background removed"}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}