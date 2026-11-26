"use client";

import { useEffect, useRef } from "react";

export interface AdSlotProps {
  slotId: string;
  format?: "auto" | "rectangle" | "horizontal";
  className?: string;
  label?: string;
}

const FORMAT_HEIGHT: Record<NonNullable<AdSlotProps["format"]>, number> = {
  auto: 280,
  rectangle: 300,
  horizontal: 120,
};

export default function AdSlot({
  slotId,
  format = "auto",
  className,
  label = "Advertisement",
}: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const enabled = Boolean(publisherId && slotId);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;
    const container = containerRef.current;
    if (container.querySelector("ins.adsbygoogle")) return;

    const ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block";
    ins.dataset.adClient = publisherId;
    ins.dataset.adSlot = slotId;
    ins.dataset.adFormat = format === "auto" ? "auto" : "";
    if (format === "rectangle") {
      ins.style.width = "300px";
      ins.style.height = "250px";
    }
    if (format === "horizontal") {
      ins.style.width = "100%";
      ins.style.height = "90px";
    }
    container.appendChild(ins);

    try {
      ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ??= []).push({});
    } catch {
      ins.remove();
    }

    return () => {
      if (ins.parentNode === container) container.removeChild(ins);
    };
  }, [enabled, format, publisherId, slotId]);

  return (
    <aside
      ref={containerRef}
      className={className}
      aria-label={label}
      data-ad-slot={slotId}
      style={{
        width: "100%",
        minHeight: FORMAT_HEIGHT[format],
        marginTop: "24px",
        marginBottom: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px dashed var(--border)",
        borderRadius: "12px",
        background: "var(--bg-card)",
        overflow: "hidden",
      }}
    >
      {!enabled && (
        <span
          style={{
            fontSize: "11px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          {label} · reserved space
        </span>
      )}
    </aside>
  );
}
