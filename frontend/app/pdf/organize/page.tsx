"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  GripVertical,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Trash2,
  X,
} from "lucide-react";
import Navbar from "../../../components/Navbar";
import UnifiedToolPage from "../../../components/tool/UnifiedToolPage";
import UnifiedToolHeader from "../../../components/tool/UnifiedToolHeader";
import ToolActionButton from "../../../components/tool/ToolActionButton";
import PostProcessingActions from "@/components/tool/PostProcessingActions";
import { organizePdf } from "../../../utils/api";
import type { OrganizeResult } from "../../../utils/api";
import styles from "./organize.module.css";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const PDF_WORKER_URL = "/pdf.worker.min.js";
const THUMBNAIL_MAX_SIDE = 180;
const THUMBNAIL_CONCURRENCY = 3;
const THUMBNAIL_CANCELLED = "THUMBNAIL_CANCELLED";

const breadcrumbItems = [
  { name: "PDF Tools", href: "/conversion" },
  { name: "Organize PDF Pages", href: "/pdf/organize" },
];

interface EditablePage {
  id: number;
  rotation: number;
}

type PdfJsModule = typeof import("pdfjs-dist");

let pdfJsPromise: Promise<PdfJsModule> | null = null;

function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfJsPromise) {
    pdfJsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
      return pdfjs;
    });
  }
  return pdfJsPromise;
}

let activeThumbnailTasks = 0;
const thumbnailQueue: Array<() => void> = [];

function scheduleThumbnail<T>(
  task: () => Promise<T>,
  isCancelled: () => boolean
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const start = () => {
      if (isCancelled()) {
        reject(new Error(THUMBNAIL_CANCELLED));
        return;
      }

      activeThumbnailTasks += 1;
      task()
        .then(
          (value) => {
            if (isCancelled()) {
              reject(new Error(THUMBNAIL_CANCELLED));
              return;
            }
            resolve(value);
          },
          (error) => {
            if (isCancelled()) {
              reject(new Error(THUMBNAIL_CANCELLED));
              return;
            }
            reject(error);
          }
        )
        .finally(() => {
          activeThumbnailTasks -= 1;
          const next = thumbnailQueue.shift();
          if (next) next();
        });
    };

    if (activeThumbnailTasks < THUMBNAIL_CONCURRENCY) {
      start();
    } else {
      thumbnailQueue.push(start);
    }
  });
}

function PdfThumbnail({
  pdf,
  pageNumber,
  rotation,
  onReady,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  rotation: number;
  onReady: (pageNumber: number) => void;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const node = holderRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      const fallback = window.setTimeout(() => setVisible(true), 0);
      return () => window.clearTimeout(fallback);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "350px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !pdf) return;

    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;
    const loadingTimer = window.setTimeout(() => setStatus("loading"), 0);

    const run = async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;

      const unscaled = page.getViewport({ scale: 1 });
      const scale = Math.min(
        THUMBNAIL_MAX_SIDE / unscaled.width,
        THUMBNAIL_MAX_SIDE / unscaled.height,
        3
      );
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas rendering is unavailable");

      canvas.width = Math.max(1, Math.ceil(viewport.width));
      canvas.height = Math.max(1, Math.ceil(viewport.height));
      context.clearRect(0, 0, canvas.width, canvas.height);

      renderTask = page.render({ canvas, canvasContext: context, viewport });
      await renderTask.promise;

      if (!cancelled) {
        setStatus("ready");
        onReady(pageNumber);
      }
    };

    scheduleThumbnail(run, () => cancelled).catch((error) => {
      if (
        !cancelled &&
        error?.message !== THUMBNAIL_CANCELLED &&
        error?.name !== "RenderingCancelledException"
      ) {
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimer);
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // The render task may already be settled.
        }
      }
    };
  }, [visible, pdf, pageNumber, onReady, attempt]);

  const showOverlay = status !== "ready";

  return (
    <div
      ref={holderRef}
      className={styles.thumbWrap}
      aria-busy={status === "loading"}
    >
      <canvas
        ref={canvasRef}
        className={`${styles.thumbCanvas} ${
          status === "ready" ? "" : styles.thumbCanvasHidden
        }`}
        style={{ transform: `rotate(${rotation}deg)` }}
        role="img"
        aria-label={`Page ${pageNumber} preview${
          rotation ? ` rotated ${rotation} degrees` : ""
        }`}
      />

      {showOverlay && (
        <div className={styles.thumbOverlay}>
          {status === "loading" && (
            <>
              <Loader2
                size={15}
                style={{ animation: "spin 1s linear infinite" }}
              />
              <span>Loading preview</span>
            </>
          )}
          {status === "idle" && <span>Preview loads as you scroll</span>}
          {status === "error" && (
            <>
              <AlertCircle size={15} />
              <span>Preview unavailable</span>
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: "2px 6px", fontSize: "10.5px" }}
                onClick={() => setAttempt((value) => value + 1)}
              >
                Retry
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function makeInitialPages(pageCount: number): EditablePage[] {
  return Array.from({ length: pageCount }, (_, id) => ({ id, rotation: 0 }));
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function friendlyPdfError(error: unknown) {
  const name = (error as { name?: string } | null)?.name;
  if (name === "PasswordException") {
    return "This PDF is password-protected. Please upload an unlocked copy.";
  }
  if (name === "InvalidPDFException") {
    return "This file is not a valid PDF or it is damaged.";
  }
  return "Could not read this PDF. The file may be corrupt.";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export default function OrganizePdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [pages, setPages] = useState<EditablePage[]>([]);
  const [originalPages, setOriginalPages] = useState<EditablePage[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const [organizing, setOrganizing] = useState(false);
  const [result, setResult] = useState<OrganizeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const [deleteIds, setDeleteIds] = useState<number[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const organizingRef = useRef(false);

  useEffect(() => {
    if (!file) {
      setPdf(null);
      setPdfLoading(false);
      setPageCount(null);
      setPages([]);
      setOriginalPages([]);
      setSelected(new Set());
      setRenderedPages(new Set());
      return;
    }

    let cancelled = false;
    let loadingTask: { destroy: () => Promise<void>; promise: Promise<PDFDocumentProxy> } | null =
      null;
    let loadedPdf: PDFDocumentProxy | null = null;

    setPdfLoading(true);
    setError(null);
    setResult(null);
    setPdf(null);
    setPageCount(null);
    setPages([]);
    setOriginalPages([]);
    setSelected(new Set());
    setRenderedPages(new Set());

    const load = async () => {
      const pdfjs = await loadPdfJs();
      if (cancelled) return;

      const data = new Uint8Array(await file.arrayBuffer());
      if (cancelled) return;

      loadingTask = pdfjs.getDocument({ data });
      loadedPdf = await loadingTask.promise;
      if (cancelled) return;

      const initialPages = makeInitialPages(loadedPdf.numPages);
      setPdf(loadedPdf);
      setPageCount(loadedPdf.numPages);
      setPages(initialPages);
      setOriginalPages(initialPages);
    };

    load()
      .catch((loadError) => {
        if (!cancelled) {
          setError(friendlyPdfError(loadError));
          setFile(null);
        }
      })
      .finally(() => {
        if (!cancelled) setPdfLoading(false);
      });

    return () => {
      cancelled = true;
      if (loadingTask) {
        loadingTask.destroy().catch(() => undefined);
        loadingTask = null;
      }
      loadedPdf = null;
    };
  }, [file]);

  useEffect(() => {
    setResult(null);
  }, [pages]);

  useEffect(() => {
    if (!deleteIds) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDeleteIds(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteIds]);

  const handleThumbReady = useCallback((pageNumber: number) => {
    const id = pageNumber - 1;
    setRenderedPages((previous) => {
      if (previous.has(id)) return previous;
      const next = new Set(previous);
      next.add(id);
      return next;
    });
  }, []);

  const validateFile = (candidate: File) => {
    const isPdf =
      candidate.type === "application/pdf" ||
      candidate.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) return "Unsupported format. Only PDF files are allowed.";
    if (candidate.size === 0) return "Empty file uploaded.";
    if (candidate.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`;
    }
    return null;
  };

  const acceptFile = useCallback((candidate: File) => {
    const validationError = validateFile(candidate);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setResult(null);
    setFile(candidate);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const candidate = event.target.files?.[0];
    if (candidate) acceptFile(candidate);
  };

  const handleZoneDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    const candidate = event.dataTransfer.files[0];
    if (candidate) acceptFile(candidate);
  };

  const removeFile = () => {
    setFile(null);
    setPdf(null);
    setPdfLoading(false);
    setPageCount(null);
    setPages([]);
    setOriginalPages([]);
    setSelected(new Set());
    setRenderedPages(new Set());
    setResult(null);
    setError(null);
    setDeleteIds(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const toggleSelected = (id: number) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(pages.map((page) => page.id)));
  };

  const clearSelection = () => {
    setSelected(new Set());
  };

  const requestDelete = (ids: number[]) => {
    const existing = ids.filter((id) => pages.some((page) => page.id === id));
    if (existing.length === 0) return;
    if (pages.length - existing.length < 1) {
      setError("At least one page must remain in the PDF.");
      return;
    }
    setError(null);
    setDeleteIds(existing);
  };

  const confirmDelete = () => {
    if (!deleteIds) return;
    if (pages.length - deleteIds.length < 1) {
      setError("At least one page must remain in the PDF.");
      setDeleteIds(null);
      return;
    }

    const removing = new Set(deleteIds);
    setPages((previous) =>
      previous.filter((page) => !removing.has(page.id))
    );
    setSelected((previous) => {
      const next = new Set<number>();
      previous.forEach((id) => {
        if (!removing.has(id)) next.add(id);
      });
      return next;
    });
    setDeleteIds(null);
    setResult(null);
  };

  const rotatePages = (ids: number[], delta: number) => {
    const rotating = new Set(ids);
    setPages((previous) =>
      previous.map((page) =>
        rotating.has(page.id)
          ? { ...page, rotation: (page.rotation + delta + 360) % 360 }
          : page
      )
    );
    setResult(null);
  };

  const rotatePage = (id: number, delta: number) => {
    rotatePages([id], delta);
  };

  const movePage = (id: number, direction: -1 | 1) => {
    setPages((previous) => {
      const index = previous.findIndex((page) => page.id === id);
      if (index < 0) return previous;
      const target = Math.max(0, Math.min(previous.length - 1, index + direction));
      if (target === index) return previous;

      const next = [...previous];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
    setResult(null);
  };

  const reorderPage = (fromId: number, toId: number) => {
    if (!Number.isInteger(fromId) || fromId === toId) return;
    setPages((previous) => {
      const fromIndex = previous.findIndex((page) => page.id === fromId);
      const toIndex = previous.findIndex((page) => page.id === toId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return previous;

      const next = [...previous];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setResult(null);
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    id: number
  ) => {
    if (organizing || pdfLoading) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(id));
    setDraggedId(id);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    targetId: number
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const rawId = event.dataTransfer.getData("text/plain");
    const fromId = rawId ? Number(rawId) : draggedId;
    if (Number.isInteger(fromId)) reorderPage(fromId as number, targetId);
    setDraggedId(null);
    setDropTargetId(null);
  };

  const resetChanges = () => {
    setPages(originalPages.map((page) => ({ ...page })));
    setSelected(new Set());
    setResult(null);
    setError(null);
    setDeleteIds(null);
    setDraggedId(null);
    setDropTargetId(null);
  };

  const organize = async () => {
    if (!file || !pdf || pages.length === 0 || organizingRef.current) return;

    organizingRef.current = true;
    setOrganizing(true);
    setError(null);
    setResult(null);

    try {
      const organized = await organizePdf(
        file,
        pages.map((page) => ({
          originalPage: page.id,
          rotation: page.rotation,
        }))
      );
      setResult(organized);
      downloadBlob(organized.blob, organized.filename);
    } catch (organizeError) {
      setError(
        organizeError instanceof Error
          ? organizeError.message
          : "PDF organization failed. Please try again."
      );
    } finally {
      organizingRef.current = false;
      setOrganizing(false);
    }
  };

  const selectedCount = selected.size;
  const allSelected =
    pages.length > 0 && pages.every((page) => selected.has(page.id));
  const currentReady = pages.filter((page) => renderedPages.has(page.id)).length;
  const deletedCount =
    pageCount !== null ? Math.max(0, pageCount - pages.length) : 0;
  const rotatedCount = pages.filter((page) => page.rotation !== 0).length;
  const orderChanged = pages.some(
    (page, index) =>
      !originalPages[index] || page.id !== originalPages[index].id
  );
  const hasChanges =
    deletedCount > 0 || rotatedCount > 0 || orderChanged;
  const busy = organizing || pdfLoading;
  const canDownload =
    !!file && !!pdf && pages.length > 0 && !busy;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Organize PDF Pages",
    url: "https://www.getzipdrop.com/pdf/organize",
    applicationCategory: "FileConverter",
    operatingSystem: "Web",
    description:
      "Free online PDF organizer. Reorder, rotate and delete PDF pages visually, then download the organized PDF. No account required.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    creator: {
      "@type": "Organization",
      name: "ZipDrop",
      url: "https://www.getzipdrop.com",
    },
  };

  const header = (
    <UnifiedToolHeader
      breadcrumbs={breadcrumbItems}
      backHref="/"
      backLabel="Back to home"
      icon={<FileText size={26} strokeWidth={2} />}
      title="Organize PDF Pages"
      description="Upload a PDF, then drag pages into the right order. Rotate pages, remove unwanted pages and download a new PDF that matches the arrangement shown here."
    />
  );

  const upload = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className={styles.visuallyHidden}
        disabled={busy}
        onChange={handleFileSelect}
      />

      {!file && (
        <div className="zd-tool-drop-wrap">
          <div
            className={`drag-zone ${dragActive ? "dragging" : ""} ${
              styles.uploadZone
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleZoneDrop}
            onClick={() => !busy && inputRef.current?.click()}
          >
            <FileText
              size={48}
              style={{
                color: dragActive
                  ? "var(--primary-teal)"
                  : "var(--text-muted)",
                transition: "color 0.2s ease",
              }}
            />
            <p
              style={{
                fontSize: "16px",
                fontWeight: 500,
                color: dragActive
                  ? "var(--primary-teal)"
                  : "var(--text-secondary)",
                transition: "color 0.2s ease",
              }}
            >
              {dragActive ? "Release to drop PDF" : "Drag & drop a PDF"}
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              or click to browse • PDF only • max {formatBytes(MAX_FILE_SIZE)}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "12px 16px",
            background: "var(--danger-light)",
            border: "1px solid rgba(214,69,69,0.20)",
            borderRadius: "10px",
            marginTop: file ? "16px" : "16px",
          }}
          role="alert"
        >
          <AlertCircle
            size={20}
            style={{
              color: "var(--danger)",
              flexShrink: 0,
              marginTop: "1px",
            }}
          />
          <p
            style={{
              fontSize: "13px",
              color: "var(--danger)",
              margin: 0,
            }}
          >
            {error}
          </p>
        </div>
      )}

      {file && (
        <div className={styles.fileSummary}>
          <div
            style={{
              color: "var(--primary-teal)",
              flexShrink: 0,
              display: "flex",
            }}
          >
            <FileText size={22} />
          </div>
          <div className={styles.fileInfo}>
            <p className={styles.fileName}>{file.name}</p>
            <div className={styles.fileMeta}>
              <span>{formatBytes(file.size)}</span>
              {pageCount !== null && (
                <>
                  <span style={{ color: "var(--text-muted)" }}>•</span>
                  <span>
                    {pageCount} page{pageCount !== 1 ? "s" : ""}
                  </span>
                </>
              )}
              {pdfLoading && (
                <>
                  <span style={{ color: "var(--text-muted)" }}>•</span>
                  <span
                    style={{
                      color: "var(--text-muted)",
                      fontStyle: "italic",
                    }}
                  >
                    reading PDF…
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            className="btn-ghost"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              opacity: busy ? 0.5 : 1,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            <Plus size={14} style={{ marginRight: "6px" }} />
            Replace PDF
          </button>
          <button
            type="button"
            className="btn-ghost"
            disabled={busy}
            onClick={removeFile}
            aria-label="Remove uploaded PDF"
            style={{
              padding: "6px",
              borderRadius: "8px",
              opacity: busy ? 0.5 : 1,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {pdfLoading && (
        <div className={styles.loadingStrip}>
          <Loader2
            size={16}
            style={{ animation: "spin 1s linear infinite" }}
          />
          <span>Reading PDF and preparing page workspace…</span>
        </div>
      )}

      {pdf && pageCount !== null && (
        <div className={styles.loadingStrip}>
          {currentReady < pages.length ? (
            <Loader2
              size={16}
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : (
            <Check size={16} style={{ color: "var(--green-highlight)" }} />
          )}
          <span>
            {currentReady} of {pages.length} page previews ready
          </span>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressBar}
              style={{
                width: `${
                  pages.length > 0
                    ? Math.round((currentReady / pages.length) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {pdf && pages.length > 0 && (
        <>
          <div className={styles.workspaceHeader}>
            <div>
              <p className="section-label" style={{ margin: 0 }}>
                PAGE WORKSPACE
              </p>
              <h2 className={styles.workspaceTitle} style={{ marginTop: "4px" }}>
                Arrange pages
              </h2>
              <p className={styles.workspaceSub}>
                Drag a card or use the arrow controls on mobile. Page
                numbers reflect the current order.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <span className={styles.toolbarCount}>
                {pages.length} page{pages.length !== 1 ? "s" : ""}
              </span>
              {deletedCount > 0 && (
                <span className={styles.toolbarCount}>
                  {deletedCount} removed
                </span>
              )}
              {rotatedCount > 0 && (
                <span className={styles.toolbarCount}>
                  {rotatedCount} rotated
                </span>
              )}
            </div>
          </div>

          <div className={styles.toolbar} role="toolbar" aria-label="Page controls">
            <div className={styles.toolbarGroup}>
              <button
                type="button"
                className={`btn-ghost ${styles.toolbarButton}`}
                onClick={selectAll}
                disabled={busy || allSelected}
                style={{ opacity: busy || allSelected ? 0.5 : 1 }}
              >
                <Check size={13} style={{ marginRight: "6px" }} />
                Select all
              </button>
              <button
                type="button"
                className={`btn-ghost ${styles.toolbarButton}`}
                onClick={clearSelection}
                disabled={busy || selectedCount === 0}
                style={{ opacity: busy || selectedCount === 0 ? 0.5 : 1 }}
              >
                Clear selection
              </button>
              <span className={styles.toolbarCount}>
                {selectedCount} selected
              </span>
            </div>

            <span className={styles.toolbarDivider} />

            <div className={styles.toolbarGroup}>
              <button
                type="button"
                className={`btn-ghost ${styles.toolbarButton} ${styles.toolbarButtonDanger}`}
                onClick={() => requestDelete(Array.from(selected))}
                disabled={busy || selectedCount === 0}
                style={{ opacity: busy || selectedCount === 0 ? 0.5 : 1 }}
              >
                <Trash2 size={13} style={{ marginRight: "6px" }} />
                Delete selected
              </button>
              <button
                type="button"
                className={`btn-ghost ${styles.toolbarButton}`}
                onClick={() => rotatePages(Array.from(selected), -90)}
                disabled={busy || selectedCount === 0}
                style={{ opacity: busy || selectedCount === 0 ? 0.5 : 1 }}
              >
                <RotateCcw size={13} style={{ marginRight: "6px" }} />
                Rotate left
              </button>
              <button
                type="button"
                className={`btn-ghost ${styles.toolbarButton}`}
                onClick={() => rotatePages(Array.from(selected), 90)}
                disabled={busy || selectedCount === 0}
                style={{ opacity: busy || selectedCount === 0 ? 0.5 : 1 }}
              >
                <RotateCw size={13} style={{ marginRight: "6px" }} />
                Rotate right
              </button>
            </div>

            <span className={styles.toolbarSpacer} />

            <div className={styles.toolbarGroup}>
              <button
                type="button"
                className={`btn-ghost ${styles.toolbarButton}`}
                onClick={resetChanges}
                disabled={busy || !hasChanges}
                style={{ opacity: busy || !hasChanges ? 0.5 : 1 }}
              >
                <RefreshCw size={13} style={{ marginRight: "6px" }} />
                Reset Changes
              </button>
            </div>
          </div>

          {pages.length === 0 ? (
            <div className={styles.emptyState}>
              No pages left. Reset changes or upload another PDF.
            </div>
          ) : (
            <div className={styles.workspace}>
              {pages.map((page, index) => {
                const isSelected = selected.has(page.id);
                const isDragging = draggedId === page.id;
                const isDropTarget = dropTargetId === page.id;
                return (
                  <div
                    key={page.id}
                    data-page-id={page.id}
                    data-position={index + 1}
                    className={[
                      styles.pageCard,
                      isSelected ? styles.pageCardSelected : "",
                      isDragging ? styles.pageCardDragging : "",
                      isDropTarget ? styles.pageCardDropTarget : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    draggable={!busy}
                    onDragStart={(event) => handleDragStart(event, page.id)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      setDropTargetId(page.id);
                    }}
                    onDragLeave={() => setDropTargetId(null)}
                    onDrop={(event) => handleDrop(event, page.id)}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDropTargetId(null);
                    }}
                  >
                    <div className={styles.cardTop}>
                      <span
                        className={styles.dragHandle}
                        title="Drag to reorder"
                        aria-hidden="true"
                      >
                        <GripVertical size={14} />
                      </span>
                      <span className={styles.pageNumber}>
                        Page {index + 1}
                      </span>
                      <label
                        className={styles.checkboxLabel}
                        title={
                          isSelected ? "Deselect page" : "Select page"
                        }
                      >
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={isSelected}
                          disabled={busy}
                          onChange={() => toggleSelected(page.id)}
                          aria-label={`Select page ${index + 1}`}
                        />
                      </label>
                    </div>

                    <PdfThumbnail
                      pdf={pdf}
                      pageNumber={page.id + 1}
                      rotation={page.rotation}
                      onReady={handleThumbReady}
                    />

                    {page.rotation !== 0 && (
                      <span className={styles.rotationBadge}>
                        {page.rotation}°
                      </span>
                    )}

                    <div className={styles.cardFooter}>
                      <span className={styles.originalLabel}>
                        Original p.{page.id + 1}
                      </span>
                      <div className={styles.cardControls}>
                        <button
                          type="button"
                          className="btn-ghost iconButton"
                          onClick={() => movePage(page.id, -1)}
                          disabled={busy || index === 0}
                          aria-label={`Move page ${index + 1} left`}
                          title="Move left"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-ghost iconButton"
                          onClick={() => movePage(page.id, 1)}
                          disabled={busy || index === pages.length - 1}
                          aria-label={`Move page ${index + 1} right`}
                          title="Move right"
                        >
                          <ChevronRight size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-ghost iconButton"
                          onClick={() => rotatePage(page.id, -90)}
                          disabled={busy}
                          aria-label={`Rotate page ${index + 1} left`}
                          title="Rotate anticlockwise"
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-ghost iconButton"
                          onClick={() => rotatePage(page.id, 90)}
                          disabled={busy}
                          aria-label={`Rotate page ${index + 1} right`}
                          title="Rotate clockwise"
                        >
                          <RotateCw size={14} />
                        </button>
                        <button
                          type="button"
                          className={`btn-ghost iconButton ${styles.iconButtonDanger}`}
                          onClick={() => requestDelete([page.id])}
                          disabled={busy}
                          aria-label={`Delete page ${index + 1}`}
                          title="Delete page"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className="btn-ghost"
              onClick={resetChanges}
              disabled={busy || !hasChanges}
              style={{
                padding: "14px 18px",
                opacity: busy || !hasChanges ? 0.5 : 1,
                cursor: busy || !hasChanges ? "not-allowed" : "pointer",
              }}
            >
              <RefreshCw size={17} style={{ marginRight: "7px" }} />
              Reset Changes
            </button>
          </div>
        </>
      )}

      {deleteIds && (
        <div
          className={styles.modalOverlay}
          onMouseDown={() => setDeleteIds(null)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="organize-delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.modalIcon}>
              <Trash2 size={22} />
            </div>
            <h2 className={styles.modalTitle} id="organize-delete-title">
              Delete {deleteIds.length} page
              {deleteIds.length !== 1 ? "s" : ""}?
            </h2>
            <p className={styles.modalText}>
              {deleteIds.length === 1
                ? "This page will be removed from the organized PDF."
                : "These pages will be removed from the organized PDF."}{" "}
              You can use Reset Changes before downloading to restore them.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setDeleteIds(null)}
                autoFocus
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-cyan"
                onClick={confirmDelete}
                style={{
                  background: "var(--danger)",
                  borderColor: "var(--danger)",
                }}
              >
                <Trash2 size={15} style={{ marginRight: "6px" }} />
                Delete page{deleteIds.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const action = pdf && pages.length > 0 && (
    <ToolActionButton
      onClick={organize}
      disabled={!canDownload}
      loading={organizing}
      loadingText="Organizing your PDF…"
      icon={<Download size={20} />}
      loadingIcon={<Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />}
    >
      Download Organized PDF
    </ToolActionButton>
  );

  const resultPanel = result && (
    <div className={styles.success} role="status" style={{ display: "block" }}>
      <div className="zd-result-head">
        <div className="zd-result-summary">
          <span className={styles.successIcon}>
            <Check size={20} />
          </span>
          <div className="zd-result-copy">
            <p className="zd-result-title">Processing complete</p>
            <div className="zd-result-meta">
              <span className="zd-result-filename" title={result.filename}>
                {result.filename}
              </span>
              <span>PDF</span>
              <span>{formatBytes(result.stats.outputSize)}</span>
              <span>
                {result.stats.pageCount} page{result.stats.pageCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn-cyan zd-result-download"
          onClick={() => downloadBlob(result.blob, result.filename)}
        >
          <Download size={17} />
          Download PDF
        </button>
      </div>
      <div className="zd-result-divider" />
      <PostProcessingActions
        file={result.blob}
        filename={result.filename}
        onReset={removeFile}
        resetLabel="Process Another PDF"
      />
    </div>
  );

  const footer = (
    <p className={styles.footerNote}>
      Files are processed securely and deleted after organizing. No permanent storage.
    </p>
  );

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <UnifiedToolPage
        toolId="organize-pdf"
        header={header}
        upload={upload}
        action={action}
        result={resultPanel}
        footer={footer}
        showFooterMessage={false}
      />
    </>
  );
}