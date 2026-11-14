"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Image, Download, Loader2, AlertCircle, Check, X, Eye, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import Navbar from "@/components/Navbar";
import { removeBackground, checkBackgroundRemoverHealth, BackgroundRemovalResult } from "@/utils/api";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPT_EXT = ".jpg,.jpeg,.png,.webp";

const TOOL_NAME = "AI Background Remover";
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
  const [processingMode, setProcessingMode] = useState<"ai" | "logo">("ai");
  const [logoSubmode, setLogoSubmode] = useState<"edge" | "enclosed">("edge");
  const [backgroundColorPreset, setBackgroundColorPreset] = useState<"auto" | "white" | "black" | "custom">("auto");
  const [backgroundColorCustom, setBackgroundColorCustom] = useState<{r: number; g: number; b: number} | null>(null);
  const [tolerancePreset, setTolerancePreset] = useState<"low" | "medium" | "high">("medium");
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
      const options: any = {};
      if (processingMode === "ai") {
        options.model = "isnet-general-use";
        options.alphaMatting = true;
      } else {
        // Map tolerance preset to value
        const toleranceMap = { low: 15, medium: 30, high: 50 };
        options.tolerance = toleranceMap[tolerancePreset];
        options.featherRadius = 1.0;
        options.erodeSize = 0;
        options.submode = logoSubmode;
        options.backgroundColorPreset = backgroundColorPreset;
        if (backgroundColorPreset === "custom" && backgroundColorCustom) {
          options.backgroundColorCustom = backgroundColorCustom;
        }
      }
      
      const result = await removeBackground(file.file, {
        mode: processingMode,
        ...options,
      });
      
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

              <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  How it works
                </h3>
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "180px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "8px", background: "var(--teal-light)", color: "var(--primary-teal)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: "14px" }}>1</span>
                    </div>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>Upload your image</p>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>Drag and drop or click to select a JPG, PNG, or WEBP file</p>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: "180px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "8px", background: "var(--teal-light)", color: "var(--primary-teal)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: "14px" }}>2</span>
                    </div>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>AI removes background</p>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>Our AI model detects the subject and removes the background automatically</p>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: "180px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "8px", background: "var(--teal-light)", color: "var(--primary-teal)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: "14px" }}>3</span>
                    </div>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>Download transparent PNG</p>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>Get your result with preserved dimensions and full transparency</p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  FAQ
                </h3>
                <dl style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <dt style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>What are the two processing modes?</dt>
                    <dd style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                      <strong>Photo / AI Mode:</strong> Uses a deep learning model (isnet-general-use) trained on diverse image datasets to detect foreground subjects. Best for photographs: portraits, products, animals, and complex scenes with varying backgrounds.<br />
                      <strong>Logo / Graphic Mode:</strong> Uses edge-connected flood-fill to detect and remove uniform backgrounds. Best for logos, icons, text graphics, and flat illustrations with solid-color backgrounds.
                    </dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>How does the AI background remover work?</dt>
                    <dd style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                      We use a state-of-the-art deep learning model (isnet-general-use) trained on diverse image datasets to accurately detect foreground subjects and separate them from backgrounds. The model handles complex edges like hair, fur, and transparent objects.
                    </dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>How does the Logo / Graphic mode work?</dt>
                    <dd style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                      This mode samples the background color from image borders, then uses flood-fill from the edges to find all connected pixels within a configurable color tolerance. It preserves enclosed areas (like holes in letters) and applies anti-aliasing for smooth edges.
                    </dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>Which image formats are supported?</dt>
                    <dd style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                      JPG, PNG, and WEBP images up to 20 MB. The output is always a transparent PNG to preserve the alpha channel.
                    </dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>Does the output support transparency?</dt>
                    <dd style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                      Yes. The result is a PNG file with a full alpha channel. Transparent areas remain transparent when downloaded.
                    </dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>Will the original image dimensions be preserved?</dt>
                    <dd style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                      Yes. The output maintains the exact same pixel dimensions as the input image.
                    </dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>Are uploaded images permanently stored?</dt>
                    <dd style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                      No. Images are processed in memory and temporary files are deleted immediately after processing. We do not store your images.
                    </dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>Is the background remover free to use?</dt>
                    <dd style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                      Yes, the tool is free to use with no registration required.
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
              Files are processed securely and deleted after processing. No permanent storage.
            </p>
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

                {/* Processing Mode Selector */}
                <div style={{ marginTop: "16px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                    Processing Mode
                  </p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => setProcessingMode("ai")}
                      disabled={processing}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "8px",
                        border: `2px solid ${processingMode === "ai" ? "var(--primary-teal)" : "var(--border)"}`,
                        background: processingMode === "ai" ? "var(--teal-light)" : "var(--bg-card)",
                        color: processingMode === "ai" ? "var(--primary-teal)" : "var(--text-secondary)",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: processing ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        opacity: processing ? 0.5 : 1,
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Image size={16} />
                        Photo / AI Mode
                      </span>
                    </button>
                    <button
                      onClick={() => setProcessingMode("logo")}
                      disabled={processing}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "8px",
                        border: `2px solid ${processingMode === "logo" ? "var(--primary-teal)" : "var(--border)"}`,
                        background: processingMode === "logo" ? "var(--teal-light)" : "var(--bg-card)",
                        color: processingMode === "logo" ? "var(--primary-teal)" : "var(--text-secondary)",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: processing ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        opacity: processing ? 0.5 : 1,
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Eye size={16} />
                        Logo / Graphic Mode
                      </span>
                    </button>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.5 }}>
                    {processingMode === "ai" 
                      ? "Best for photographs: portraits, products, animals, and complex scenes. Uses AI to detect foreground subjects." 
                      : "Best for logos, icons, text graphics, and flat illustrations with uniform backgrounds. Uses edge-based color detection."}
                  </p>
                </div>

                {/* Logo Mode Options - only show when Logo mode is selected */}
                {processingMode === "logo" && (
                  <div style={{ marginTop: "16px", padding: "16px", background: "var(--editor-workspace)", border: "1px solid var(--border)", borderRadius: "10px" }}>
                    {/* Submode Selector */}
                    <div style={{ marginBottom: "16px" }}>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                        Background Removal Method
                      </p>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => setLogoSubmode("edge")}
                          disabled={processing}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: `2px solid ${logoSubmode === "edge" ? "var(--primary-teal)" : "var(--border)"}`,
                            background: logoSubmode === "edge" ? "var(--teal-light)" : "var(--bg-card)",
                            color: logoSubmode === "edge" ? "var(--primary-teal)" : "var(--text-secondary)",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: processing ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            opacity: processing ? 0.5 : 1,
                          }}
                        >
                          Edge-Connected Only
                        </button>
                        <button
                          onClick={() => setLogoSubmode("enclosed")}
                          disabled={processing}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: `2px solid ${logoSubmode === "enclosed" ? "var(--primary-teal)" : "var(--border)"}`,
                            background: logoSubmode === "enclosed" ? "var(--teal-light)" : "var(--bg-card)",
                            color: logoSubmode === "enclosed" ? "var(--primary-teal)" : "var(--text-secondary)",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: processing ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            opacity: processing ? 0.5 : 1,
                          }}
                        >
                          Remove Enclosed Regions
                        </button>
                      </div>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.5 }}>
                        {logoSubmode === "edge" 
                          ? "Only removes background connected to image edges. Preserves enclosed regions (e.g., white inside letters)." 
                          : "Removes ALL pixels matching the background color, including enclosed regions like letter counters (o, p, d, etc.)."}
                      </p>
                    </div>

                    {/* Background Color Preset */}
                    <div style={{ marginBottom: "16px" }}>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                        Background Color
                      </p>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                        <button
                          onClick={() => setBackgroundColorPreset("auto")}
                          disabled={processing}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: `2px solid ${backgroundColorPreset === "auto" ? "var(--primary-teal)" : "var(--border)"}`,
                            background: backgroundColorPreset === "auto" ? "var(--teal-light)" : "var(--bg-card)",
                            color: backgroundColorPreset === "auto" ? "var(--primary-teal)" : "var(--text-secondary)",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: processing ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            opacity: processing ? 0.5 : 1,
                          }}
                        >
                          Auto Detect
                        </button>
                        <button
                          onClick={() => setBackgroundColorPreset("white")}
                          disabled={processing}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: `2px solid ${backgroundColorPreset === "white" ? "var(--primary-teal)" : "var(--border)"}`,
                            background: backgroundColorPreset === "white" ? "var(--teal-light)" : "var(--bg-card)",
                            color: backgroundColorPreset === "white" ? "var(--primary-teal)" : "var(--text-secondary)",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: processing ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            opacity: processing ? 0.5 : 1,
                          }}
                        >
                          White
                        </button>
                        <button
                          onClick={() => setBackgroundColorPreset("black")}
                          disabled={processing}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: `2px solid ${backgroundColorPreset === "black" ? "var(--primary-teal)" : "var(--border)"}`,
                            background: backgroundColorPreset === "black" ? "var(--teal-light)" : "var(--bg-card)",
                            color: backgroundColorPreset === "black" ? "var(--primary-teal)" : "var(--text-secondary)",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: processing ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            opacity: processing ? 0.5 : 1,
                          }}
                        >
                          Black
                        </button>
                        <button
                          onClick={() => setBackgroundColorPreset("custom")}
                          disabled={processing}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: `2px solid ${backgroundColorPreset === "custom" ? "var(--primary-teal)" : "var(--border)"}`,
                            background: backgroundColorPreset === "custom" ? "var(--teal-light)" : "var(--bg-card)",
                            color: backgroundColorPreset === "custom" ? "var(--primary-teal)" : "var(--text-secondary)",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: processing ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            opacity: processing ? 0.5 : 1,
                          }}
                        >
                          Custom
                        </button>
                        {backgroundColorPreset === "custom" && (
                          <input
                            type="color"
                            value={`rgb(${backgroundColorCustom?.r || 255},${backgroundColorCustom?.g || 255},${backgroundColorCustom?.b || 255})`}
                            onChange={(e) => {
                              const hex = e.target.value;
                              const r = parseInt(hex.slice(1, 3), 16);
                              const g = parseInt(hex.slice(3, 5), 16);
                              const b = parseInt(hex.slice(5, 7), 16);
                              setBackgroundColorCustom({ r, g, b });
                            }}
                            disabled={processing}
                            style={{ width: "36px", height: "36px", border: "none", borderRadius: "6px", cursor: processing ? "not-allowed" : "pointer", opacity: processing ? 0.5 : 1 }}
                            title="Pick custom background color"
                          />
                        )}
                      </div>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.5 }}>
                        The background color to remove. "Auto Detect" samples from image borders. Choose "White" or "Black" for common backgrounds, or "Custom" to pick a specific color.
                      </p>
                    </div>

                    {/* Tolerance Preset */}
                    <div>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                        Color Tolerance
                      </p>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => setTolerancePreset("low")}
                          disabled={processing}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: `2px solid ${tolerancePreset === "low" ? "var(--primary-teal)" : "var(--border)"}`,
                            background: tolerancePreset === "low" ? "var(--teal-light)" : "var(--bg-card)",
                            color: tolerancePreset === "low" ? "var(--primary-teal)" : "var(--text-secondary)",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: processing ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            opacity: processing ? 0.5 : 1,
                          }}
                        >
                          Low (15)
                        </button>
                        <button
                          onClick={() => setTolerancePreset("medium")}
                          disabled={processing}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: `2px solid ${tolerancePreset === "medium" ? "var(--primary-teal)" : "var(--border)"}`,
                            background: tolerancePreset === "medium" ? "var(--teal-light)" : "var(--bg-card)",
                            color: tolerancePreset === "medium" ? "var(--primary-teal)" : "var(--text-secondary)",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: processing ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            opacity: processing ? 0.5 : 1,
                          }}
                        >
                          Medium (30)
                        </button>
                        <button
                          onClick={() => setTolerancePreset("high")}
                          disabled={processing}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: `2px solid ${tolerancePreset === "high" ? "var(--primary-teal)" : "var(--border)"}`,
                            background: tolerancePreset === "high" ? "var(--teal-light)" : "var(--bg-card)",
                            color: tolerancePreset === "high" ? "var(--primary-teal)" : "var(--text-secondary)",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: processing ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            opacity: processing ? 0.5 : 1,
                          }}
                        >
                          High (50)
                        </button>
                      </div>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.5 }}>
                        How closely a pixel must match the background color to be removed. Lower = stricter (preserves more detail), Higher = more aggressive (removes more background).
                      </p>
                    </div>
                  </div>
                )}

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
                    {processingMode === "ai"
                      ? "Tip: The AI works best on images with clear subject-background separation. Complex edges like hair and fur are handled automatically."
                      : logoSubmode === "enclosed"
                        ? "Tip: Enclosed mode removes all matching background color, including inside letters. Use 'White' preset for white backgrounds. Adjust tolerance if details are lost."
                        : "Tip: Edge mode only removes background connected to edges. Preserves white inside letters. Best for logos with distinct edge separation."}
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
                </div>

                {/* Download and actions */}
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", paddingTop: "8px" }}>
                  <button
                    onClick={downloadResult}
                    className="btn-cyan"
                    style={{ padding: "14px 28px", fontSize: "15px", fontWeight: 700 }}
                  >
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1={12} y1={15} x2={12} y2={3}></line>
                    </svg>
                    Download PNG
                  </button>
                  <button
                    onClick={removeFile}
                    className="btn-ghost"
                    style={{ padding: "14px 28px", fontSize: "15px", fontWeight: 600 }}
                  >
                    <RotateCcw size={18} />
                    Remove Another
                  </button>
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", padding: "16px", background: "var(--editor-workspace)", border: "1px solid var(--border)", borderRadius: "12px" }}>
                  <div>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
                      Original Size
                    </p>
                    <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-mono)" }}>
                      {formatBytes(file.size)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
                      Output Size
                    </p>
                    <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary-teal)", margin: 0, fontFamily: "var(--font-mono)" }}>
                      {formatBytes(result.blob.size)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
                      Dimensions
                    </p>
                    <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-mono)" }}>
                      {result.stats.originalWidth}×{result.stats.originalHeight}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
                      Processing Mode
                    </p>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--primary-teal)", margin: 0, fontFamily: "var(--font-mono)" }}>
                      {result.stats.processingMode === "ai" ? "Photo / AI" : "Logo / Graphic"}
                    </p>
                  </div>
                  {result.stats.processingMode === "logo" && (
                    <>
                      <div>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
                          Logo Submode
                        </p>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--primary-teal)", margin: 0, fontFamily: "var(--font-mono)" }}>
                          {result.stats.logoSubmode === "edge" ? "Edge-Connected" : "Enclosed Regions"}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
                          Background Preset
                        </p>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--primary-teal)", margin: 0, fontFamily: "var(--font-mono)" }}>
                          {backgroundColorPreset === "custom" && backgroundColorCustom 
                            ? `Custom (${backgroundColorCustom.r},${backgroundColorCustom.g},${backgroundColorCustom.b})` 
                            : backgroundColorPreset.charAt(0).toUpperCase() + backgroundColorPreset.slice(1)}
                        </p>
                      </div>
                    </>
                  )}
                  <div>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
                      Model Used
                    </p>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--primary-teal)", margin: 0, fontFamily: "var(--font-mono)" }}>
                      {result.stats.modelUsed}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* How it works */}
            <div style={{ paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                How it works
              </h3>
              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "180px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "8px", background: "var(--teal-light)", color: "var(--primary-teal)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: "14px" }}>1</span>
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>Upload your image</p>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>Drag and drop or click to select a JPG, PNG, or WEBP file</p>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: "180px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "8px", background: "var(--teal-light)", color: "var(--primary-teal)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: "14px" }}>2</span>
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>AI removes background</p>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>Our AI model detects the subject and removes the background automatically</p>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: "180px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "8px", background: "var(--teal-light)", color: "var(--primary-teal)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: "14px" }}>3</span>
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>Download transparent PNG</p>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>Get your result with preserved dimensions and full transparency</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div style={{ paddingTop: "24px", borderTop: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                FAQ
              </h3>
              <dl style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <dt style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>What are the two processing modes?</dt>
                  <dd style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                    <strong>Photo / AI Mode:</strong> Uses a deep learning model (isnet-general-use) trained on diverse image datasets to detect foreground subjects. Best for photographs: portraits, products, animals, and complex scenes with varying backgrounds.<br />
                    <strong>Logo / Graphic Mode:</strong> Uses edge-connected flood-fill to detect and remove uniform backgrounds. Best for logos, icons, text graphics, and flat illustrations with solid-color backgrounds.
                  </dd>
                </div>
                <div>
                  <dt style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>How does the AI background remover work?</dt>
                  <dd style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                    We use a state-of-the-art deep learning model (isnet-general-use) trained on diverse image datasets to accurately detect foreground subjects and separate them from backgrounds. The model handles complex edges like hair, fur, and transparent objects.
                  </dd>
                </div>
                <div>
                  <dt style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>How does the Logo / Graphic mode work?</dt>
                  <dd style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                    This mode samples the background color from image borders, then uses flood-fill from the edges to find all connected pixels within a configurable color tolerance. It preserves enclosed areas (like holes in letters) and applies anti-aliasing for smooth edges.
                  </dd>
                </div>
                <div>
                  <dt style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>Which image formats are supported?</dt>
                  <dd style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                    JPG, PNG, and WEBP images up to 20 MB. The output is always a transparent PNG to preserve the alpha channel.
                  </dd>
                </div>
                <div>
                  <dt style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>Does the output support transparency?</dt>
                  <dd style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                    Yes. The result is a PNG file with a full alpha channel. Transparent areas remain transparent when downloaded.
                  </dd>
                </div>
                <div>
                  <dt style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>Will the original image dimensions be preserved?</dt>
                  <dd style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                    Yes. The output maintains the exact same pixel dimensions as the input image.
                  </dd>
                </div>
                <div>
                  <dt style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>Are uploaded images permanently stored?</dt>
                  <dd style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                    No. Images are processed in memory and temporary files are deleted immediately after processing. We do not store your images.
                  </dd>
                </div>
                <div>
                  <dt style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>Is the background remover free to use?</dt>
                  <dd style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                    Yes, the tool is free to use with no registration required.
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
            Files are processed securely and deleted after processing. No permanent storage.
          </p>
        </div>
      </div>

      {/* Zoom modal */}
      {zoomedImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
          onClick={closeZoom}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <button
              onClick={closeZoom}
              style={{
                position: "absolute",
                top: "-48px",
                right: 0,
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                border: "none",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={24} />
            </button>
            <img
              src={zoomedImage === "original" ? file.preview : URL.createObjectURL(result!.blob)}
              alt={zoomedImage === "original" ? "Original" : "Background removed"}
              style={{
                maxWidth: "100%",
                maxHeight: "90vh",
                objectFit: "contain",
                borderRadius: "8px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              }}
            />
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.7)", marginTop: "16px", fontSize: "14px" }}>
              {zoomedImage === "original" ? "Original Image" : "Background Removed"} — Click outside to close
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function ErrorDisplay({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
      padding: "12px 16px",
      background: "var(--danger-light)",
      border: "1px solid rgba(214,69,69,0.20)",
      borderRadius: "10px",
      animation: "slideUp 0.3s ease forwards",
    }}>
      <AlertCircle size={20} style={{ color: "var(--danger)", flexShrink: 0, marginTop: "1px" }} />
      <p style={{ fontSize: "13px", color: "var(--danger)", margin: 0 }}>{error}</p>
    </div>
  );
}