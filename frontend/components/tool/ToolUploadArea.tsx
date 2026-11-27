"use client";

import { ReactNode, DragEvent, ChangeEvent, useRef, useCallback } from "react";

interface ToolUploadAreaProps {
  label: string;
  subLabel?: string;
  icon: ReactNode;
  accept?: string;
  multiple?: boolean;
  maxFileSize?: number;
  formatBytes?: (bytes: number) => string;
  onFileSelect: (files: FileList | null) => void;
  disabled?: boolean;
  dragActive?: boolean;
  setDragActive?: (active: boolean) => void;
  children?: ReactNode;
}

export default function ToolUploadArea({
  label,
  subLabel,
  icon,
  accept,
  multiple = false,
  maxFileSize,
  formatBytes,
  onFileSelect,
  disabled = false,
  dragActive = false,
  setDragActive,
  children,
}: ToolUploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive?.(true);
  }, [setDragActive]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive?.(false);
  }, [setDragActive]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive?.(false);
    if (e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files);
    }
  }, [onFileSelect, setDragActive]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files);
    } else {
      onFileSelect(null);
    }
  }, [onFileSelect]);

  const maxSizeText = maxFileSize && formatBytes
    ? ` (max ${formatBytes(maxFileSize)})`
    : "";

  return (
    <div
      className={`drag-zone ${dragActive ? "dragging" : ""}`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        position: "relative",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: "none" }}
        onChange={handleInputChange}
        disabled={disabled}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "32px 24px", textAlign: "center" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: dragActive ? "var(--teal-light)" : "var(--bg-card)",
            border: `2px dashed ${dragActive ? "var(--primary-teal)" : "var(--border)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: dragActive ? "var(--primary-teal)" : "var(--text-muted)",
            transition: "all 0.2s ease",
          }}
        >
          {icon}
        </div>
        <p style={{ fontSize: "16px", fontWeight: 500, color: dragActive ? "var(--primary-teal)" : "var(--text-secondary)", transition: "color 0.2s ease", margin: 0 }}>
          {dragActive ? "Release to upload" : label}
        </p>
        {(subLabel || maxSizeText) && (
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            {subLabel || ""}{maxSizeText}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}