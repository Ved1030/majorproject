"use client";

import { useState, useCallback, useRef } from "react";
import { Image, Download, Loader2, AlertCircle, Check, X, RotateCcw, Eye, Maximize2, Minimize2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { removeBackground, BackgroundRemovalResult } from "@/utils/api";
import UnifiedToolPage from "@/components/tool/UnifiedToolPage";
import UnifiedToolHeader from "@/components/tool/UnifiedToolHeader";
import ToolInfoBlock from "@/components/tool/ToolInfoBlock";
import ToolUploadArea from "@/components/tool/ToolUploadArea";
import ToolFilePreview from "@/components/tool/ToolFilePreview";
import ToolActionButton from "@/components/tool/ToolActionButton";
import PostProcessingActions from "@/components/tool/PostProcessingActions";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
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

interface BackgroundRemovalResultWithUrl extends BackgroundRemovalResult { objectUrl?: string; }
interface UploadedFile { file: File; preview: string; originalName: string; size: number; format: string; width?: number; height?: number; }

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
    if (!ACCEPTED_TYPES.includes(f.type)) return "Unsupported file type. Please upload JPG, PNG, or WEBP.";
    if (f.size > MAX_FILE_SIZE) return `File is too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`;
    return null;
  }, []);

  const handleFileSelect = useCallback((newFile: File) => {
    const err = validateFile(newFile);
    if (err) { setError(err); return; }
    const preview = URL.createObjectURL(newFile);
    const img = document.createElement('img');
    img.src = preview;
    img.onload = () => { setFile({ file: newFile, preview, originalName: newFile.name, size: newFile.size, format: getFileFormat(newFile), width: img.naturalWidth, height: img.naturalHeight }); setError(null); setResult(null); };
    img.onerror = () => { URL.revokeObjectURL(preview); setError("Failed to load image. The file may be corrupted."); };
  }, [validateFile]);

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files[0]); }, [handleFileSelect]);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }, []);

  const removeFile = useCallback(() => { if (file?.preview) URL.revokeObjectURL(file.preview); if (result?.objectUrl) URL.revokeObjectURL(result.objectUrl); setFile(null); setResult(null); setError(null); if (inputRef.current) inputRef.current.value = ""; }, [file, result]);

  const processImage = async () => {
    if (!file || processing) return;
    setProcessing(true); setError(null);
    try { const res = await removeBackground(file.file); const objectUrl = URL.createObjectURL(res.blob); setResult({ ...res, objectUrl }); }
    catch (err: any) { setError(err.message || "Background removal failed. Please try again."); }
    finally { setProcessing(false); }
  };

  const downloadResult = () => { if (!result) return; const url = URL.createObjectURL(result.blob); const a = document.createElement("a"); a.href = url; a.download = result.filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); };

  const openZoom = (type: "original" | "result") => { setZoomedImage(type); };

  const closeZoom = () => {
    setZoomedImage(null);
  };

  const getBackgroundStyle = (bg: typeof BACKGROUND_OPTIONS[0]): React.CSSProperties => {
    if (bg.pattern) return { backgroundImage: `linear-gradient(45deg, #E8E8E8 25%, transparent 25%),linear-gradient(-45deg, #E8E8E8 25%, transparent 25%),linear-gradient(45deg, transparent 75%, #E8E8E8 75%),linear-gradient(-45deg, transparent 75%, #E8E8E8 75%)`, backgroundSize: "20px 20px", backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px", backgroundColor: "#FFFFFF" };
    if (typeof bg.color === "string" && bg.color.startsWith("linear-gradient")) return { background: bg.color };
    return { backgroundColor: bg.color as string };
  };

  const header = (
    <UnifiedToolHeader
      breadcrumbs={breadcrumbItems}
      backHref="/conversion?category=image-tools"
      icon={<Image size={28} strokeWidth={2} />}
      title="Background Remover"
      description={TOOL_DESCRIPTION}
    />
  );

  const upload = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_EXT}
        hidden
        onChange={(e) => { const selected = e.target.files?.[0]; if (selected) handleFileSelect(selected); }}
      />
      <div className="zd-tool-drop-wrap">
        <ToolUploadArea
          label="Drop an image here or click to browse"
          subLabel="JPG, PNG, WEBP • Max 20 MB"
          icon={<Image size={48} />}
          accept={ACCEPT_EXT}
          maxFileSize={MAX_FILE_SIZE}
          formatBytes={formatBytes}
          onFileSelect={(files) => files?.[0] && handleFileSelect(files[0])}
          disabled={processing}
          dragActive={dragActive}
          setDragActive={setDragActive}
        />
      </div>

      {file && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ width: 80, height: 80, borderRadius: "12px", overflow: "hidden", background: "var(--bg-card)", border: "1px solid var(--border)", flexShrink: 0 }}><img src={file.preview} alt={file.originalName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
            <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: "0 0 4px" }}>{file.originalName}</p><p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>{file.format.toUpperCase()} • {formatBytes(file.size)} • {file.width}×{file.height}px</p></div>
            <button onClick={removeFile} className="btn-ghost" style={{ height: "40px" }}><RotateCcw size={16} /> New Image</button>
          </div>
        </div>
      )}

      {file && !result && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "var(--editor-workspace)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "12px", color: "var(--text-secondary)" }}><Eye size={16} style={{ color: "var(--text-muted)" }} /> <span>The AI automatically detects your image type (photo or graphic) and applies the best removal method. No settings needed.</span></div>
      )}

      {error && <div style={{ marginTop: "16px", padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px", color: "#ef4444", fontSize: "13px" }}><AlertCircle size={18} style={{ flexShrink: 0 }} /> <span>{error}</span></div>}
    </>
  );

  const controls = result && (
    <div>
      <div className="zd-tool-options-title">
        <Image size={17} />
        <h2>Preview Background</h2>
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {BACKGROUND_OPTIONS.map((bg) => (<button key={bg.id} onClick={() => setSelectedBackground(bg.id)} style={{ padding: "8px 14px", borderRadius: "8px", border: `2px solid ${selectedBackground === bg.id ? "var(--primary-teal)" : "var(--border)"}`, background: selectedBackground === bg.id ? "var(--teal-light)" : "var(--bg-card)", color: selectedBackground === bg.id ? "var(--primary-teal)" : "var(--text-secondary)", fontSize: "12px", fontWeight: 500, cursor: "pointer", transition: "all 0.2s ease", whiteSpace: "nowrap" }}>{bg.name}</button>))}
      </div>
      <div className="zd-tool-options-title" style={{ marginTop: "18px" }}>
        <Eye size={17} />
        <h2>View Options</h2>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)" }}><input type="checkbox" checked={showComparison} onChange={(e) => setShowComparison(e.target.checked)} style={{ width: "18px", height: "18px", accentColor: "var(--primary-teal)" }} /> Show before/after comparison slider</label>
        <div style={{ display: "flex", gap: "8px" }}><button onClick={() => openZoom("original")} className="btn-ghost" title="Zoom original"><Maximize2 size={16} /></button><button onClick={() => openZoom("result")} className="btn-ghost" title="Zoom result"><Maximize2 size={16} /></button></div>
      </div>
    </div>
  );

  const action = (
    <ToolActionButton onClick={processImage} disabled={processing} loading={processing} loadingText="Removing background..." icon={<Image size={20} />} loadingIcon={<Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />}>Remove Background</ToolActionButton>
  );

  const instructions = (
    <>
      <ToolInfoBlock
        title="How it works"
        items={[
          "Upload a JPG, PNG, or WEBP image (max 20 MB)",
          "AI automatically detects photo or graphic type",
          "Best removal method applied automatically",
          "Download transparent PNG with preserved dimensions",
        ]}
        variant="notes"
      />
      <ToolInfoBlock
        title="Image Requirements"
        items={[
          "Supported formats: JPG, PNG, WEBP",
          "Maximum file size: 20 MB",
          "Output is always transparent PNG",
          "Original dimensions preserved",
        ]}
        variant="notes"
      />
      {result && (
        <ToolInfoBlock
          title="Preview Options"
          items={[
            "Toggle comparison slider to see before/after",
            "Choose background: transparent, colors, or gradients",
            "Zoom images for detailed inspection",
          ]}
          variant="notes"
        />
      )}
    </>
  );

  const privacy = (
    <ToolInfoBlock
      title="Privacy & Security"
      items={[
        "Files are processed securely and deleted after processing",
        "No permanent storage of your images",
        "Files are not shared with third parties",
      ]}
      variant="privacy"
    />
  );

  const resultPanel = result && file && (
    <div className="animate-scaleIn" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="divider" style={{ borderTop: "1px solid var(--border)" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {showComparison ? (
          <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg-card)" }}><div style={{ position: "relative", width: "100%", aspectRatio: file.width && file.height ? `${file.width}/${file.height}` : "auto", maxHeight: "600px" }}><div style={{ position: "absolute", inset: 0, overflow: "hidden" }}><img ref={originalImgRef} src={file.preview} alt="Original" style={{ width: "100%", height: "100%", objectFit: "contain", ...getBackgroundStyle(BACKGROUND_OPTIONS.find(b => b.id === selectedBackground)!) }} /></div><div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${comparisonPosition}%`, overflow: "hidden", borderRight: "2px solid var(--primary-teal)" }}><img ref={resultImgRef} src={result.objectUrl || URL.createObjectURL(result.blob)} alt="Background removed" style={{ width: "100%", height: "100%", objectFit: "contain", ...getBackgroundStyle(BACKGROUND_OPTIONS.find(b => b.id === selectedBackground)!) }} /></div><div style={{ position: "absolute", left: `calc(${comparisonPosition}% - 12px)`, top: 0, bottom: 0, width: "24px", background: "var(--primary-teal)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "ew-resize", zIndex: 10 }} onMouseDown={(e) => { e.preventDefault(); const handleMove = (moveEvent: MouseEvent) => { const rect = e.currentTarget.parentElement!.getBoundingClientRect(); const pos = ((moveEvent.clientX - rect.left) / rect.width) * 100; setComparisonPosition(Math.max(0, Math.min(100, pos))); }; const handleUp = () => { document.removeEventListener("mousemove", handleMove); document.removeEventListener("mouseup", handleUp); }; document.addEventListener("mousemove", handleMove); document.addEventListener("mouseup", handleUp); }}><svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}><polyline points="15 18 9 12 15 6"></polyline><polyline points="9 18 15 12 9 6"></polyline></svg></div><div style={{ position: "absolute", top: 12, left: 12, zIndex: 5, background: "rgba(0,0,0,0.6)", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 500 }}>Original</div><div style={{ position: "absolute", top: 12, right: 12, zIndex: 5, background: "rgba(7,140,145,0.9)", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 500 }}>No Background</div></div></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg-card)", aspectRatio: file.width && file.height ? `${file.width}/${file.height}` : "auto", maxHeight: "500px" }}><img ref={originalImgRef} src={file.preview} alt="Original" style={{ width: "100%", height: "100%", objectFit: "contain", ...getBackgroundStyle(BACKGROUND_OPTIONS.find(b => b.id === selectedBackground)!) }} /><div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(0,0,0,0.6)", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 500 }}>Original</div><button onClick={() => openZoom("original")} style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "8px", background: "rgba(255,255,255,0.9)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Maximize2 size={18} /></button></div>
            <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg-card)", aspectRatio: file.width && file.height ? `${file.width}/${file.height}` : "auto", maxHeight: "500px" }}><div style={{ width: "100%", height: "100%", position: "relative", ...getBackgroundStyle(BACKGROUND_OPTIONS.find(b => b.id === selectedBackground)!) }}><img ref={resultImgRef} src={result.objectUrl || URL.createObjectURL(result.blob)} alt="Background removed" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div><div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(7,140,145,0.9)", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 500 }}>No Background</div><button onClick={() => openZoom("result")} style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "8px", background: "rgba(255,255,255,0.9)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Maximize2 size={18} /></button></div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "8px" }}>
        <button onClick={downloadResult} className="btn-cyan" style={{ width: "100%", padding: "14px 24px", fontSize: "15px", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}><Download size={20} /> Download PNG</button>
        <div className="zd-result-head">
          <div className="zd-result-summary">
            <span className="zd-result-check"><Check size={22} /></span>
            <div className="zd-result-copy">
              <p className="zd-result-title">Processing complete</p>
              <div className="zd-result-meta">
                <span className="zd-result-filename" title={result.filename}>{result.filename}</span>
                <span>PNG</span>
                <span>{formatBytes(result.blob.size)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="zd-result-divider" />
        <PostProcessingActions
          file={result.blob}
          filename={result.filename}
          onReset={removeFile}
          resetLabel="Process Another Image"
        />
      </div>
    </div>
  );

  const footer = <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>Files are processed securely and deleted after processing. No permanent storage.</p>;

  return (
    <>
      <Navbar />
      <UnifiedToolPage
        toolId="remove-background"
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

      {zoomedImage && file && (
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
            }}
            aria-label="Close zoom"
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
    </>
  );
}

interface BackgroundRemovalResultWithUrl extends BackgroundRemovalResult { objectUrl?: string; }
interface UploadedFile { file: File; preview: string; originalName: string; size: number; format: string; width?: number; height?: number; }
