"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const TIP_KEY = "zd_a2hs_dismissed";

export default function AddToHomeScreenTip({ onDownload }: { onDownload?: () => void }) {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Only show on mobile-ish viewports and if not dismissed
    const dismissed = localStorage.getItem(TIP_KEY);
    if (dismissed === "1") return;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) return;

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShow(false);
        localStorage.setItem(TIP_KEY, "1");
      }
      setDeferredPrompt(null);
    } else {
      setShow(false);
      localStorage.setItem(TIP_KEY, "1");
    }
    if (onDownload) onDownload();
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(TIP_KEY, "1");
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 200,
        padding: "10px 16px calc(10px + env(safe-area-inset-bottom, 0px))",
        background: "var(--bg-card)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "var(--text-secondary)",
            lineHeight: 1.4,
          }}
        >
          Install ZipDrop on your home screen for quick access.
        </p>
      </div>
      <button
        onClick={handleInstall}
        style={{
          flex: "0 0 auto",
          padding: "8px 14px",
          borderRadius: "10px",
          border: "1px solid var(--border)",
          background: "#FFFFFF",
          color: "var(--primary-teal)",
          fontSize: "13px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Add
      </button>
      <button
        onClick={handleDismiss}
        style={{
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: "8px",
          border: "none",
          background: "transparent",
          color: "var(--text-muted)",
          cursor: "pointer",
        }}
      >
        <X size={18} strokeWidth={2} />
      </button>
    </div>
  );
}
