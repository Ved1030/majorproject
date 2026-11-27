"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Copy, Loader2, Smartphone, X } from "lucide-react";

interface CtaProps {
  file: File;
  onDone?: () => void;
  compact?: boolean;
}

export function ShareProcessedFileButton({ file, onDone, compact = false }: CtaProps) {
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const send = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      const response = await fetch("/api/send", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create a share code");
      setCode(String(data.code ?? ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create a share code");
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (code) {
    return (
      <div className="zd-share-code">
        <span className="zd-share-code-label">
          Your 4-digit code:{" "}
          <strong className="zd-share-code-value">{code}</strong>
        </span>
        <button type="button" onClick={copyCode} className="btn-ghost zd-share-code-button">
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copied" : "Copy code"}
        </button>
        {onDone && (
          <button type="button" onClick={onDone} className="btn-ghost zd-share-code-button">
            Done
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={compact ? "zd-share-compact" : "zd-action-wrapper"}>
      <button
        type="button"
        onClick={send}
        disabled={busy}
        className={compact ? "zd-share-compact-button" : "zd-action-card zd-action-card--share"}
      >
        <span className="zd-action-icon">
          {busy ? (
            <Loader2 size={20} className="zd-spin" />
          ) : (
            <Smartphone size={20} />
          )}
        </span>
        <span className="zd-action-copy">
          <span className="zd-action-title">Send to Another Device</span>
          <span className="zd-action-subtitle">Share instantly using a 4-digit code</span>
        </span>
        <ArrowRight size={18} className="zd-action-arrow" />
      </button>
      {error && <p className="zd-action-error">{error}</p>}
    </div>
  );
}

export default function AutoProcessedFileShareCta() {
  const pathname = useRef<string>("");
  const [captured, setCaptured] = useState<File | null>(null);
  const [visible, setVisible] = useState(true);
  const [toolRoute, setToolRoute] = useState(false);

  useEffect(() => {
    const current = window.location.pathname;
    pathname.current = current;
    setToolRoute(
      ["/conversion", "/compression", "/image-tools", "/pdf"].some((prefix) =>
        current.startsWith(prefix)
      )
    );
  }, []);

  useEffect(() => {
    if (!toolRoute) return;

    const blobUrls = new Map<string, Blob>();
    const originalCreateObjectURL = URL.createObjectURL.bind(URL);
    const originalClick = HTMLAnchorElement.prototype.click;

    URL.createObjectURL = function patchedCreateObjectURL(object: Blob | MediaSource) {
      const url = originalCreateObjectURL(object);
      if (typeof Blob !== "undefined" && object instanceof Blob) {
        blobUrls.set(url, object);
      }
      return url;
    };

    HTMLAnchorElement.prototype.click = function patchedClick(this: HTMLAnchorElement) {
      try {
        const blob = blobUrls.get(this.href);
        if (blob && this.hasAttribute("download")) {
          const name = this.download || "zipdrop-file";
          setCaptured(
            new File([blob], name, { type: blob.type || "application/octet-stream" })
          );
          setVisible(true);
        }
      } catch {
        // Observation must never interrupt the original download.
      }
      return originalClick.call(this);
    };

    return () => {
      URL.createObjectURL = originalCreateObjectURL;
      HTMLAnchorElement.prototype.click = originalClick;
    };
  }, [toolRoute]);

  if (!toolRoute || !captured || !visible) return null;

  return (
    <div
      role="complementary"
      aria-label="Send processed file to another device"
      style={{
        position: "fixed",
        right: "24px",
        bottom: "24px",
        zIndex: 900,
        width: "min(340px, calc(100vw - 48px))",
        padding: "18px 20px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        boxShadow: "0 12px 40px rgba(32,43,54,0.16)",
      }}
    >
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "transparent",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer",
        }}
      >
        <X size={16} />
      </button>
      <p style={{ fontSize: "13px", fontWeight: 650, color: "var(--text-primary)", marginBottom: "4px" }}>
        File ready on this device
      </p>
      <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "0" }}>
        {captured.name}
      </p>
      <ShareProcessedFileButton file={captured} compact onDone={() => setVisible(false)} />
    </div>
  );
}
