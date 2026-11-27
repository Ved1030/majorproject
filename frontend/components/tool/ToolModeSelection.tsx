"use client";

import { ReactNode } from "react";
import { Check } from "lucide-react";

interface ModeOption {
  value: string;
  label: string;
  description: string;
  icon?: ReactNode;
}

interface ToolModeSelectionProps {
  title: string;
  modes: ModeOption[];
  selectedMode: string;
  onModeChange: (mode: string) => void;
  disabled?: boolean;
  helperText?: string;
}

export default function ToolModeSelection({
  title,
  modes,
  selectedMode,
  onModeChange,
  disabled = false,
  helperText,
}: ToolModeSelectionProps) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {title}
      </label>
      {helperText && (
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
          {helperText}
        </p>
      )}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => !disabled && onModeChange(mode.value)}
            disabled={disabled}
            style={{
              flex: 1,
              minWidth: "min(220px, 100%)",
              maxWidth: "100%",
              padding: "18px 20px",
              borderRadius: "14px",
              border: `2px solid ${selectedMode === mode.value ? "var(--primary-teal)" : "var(--border)"}`,
              background: selectedMode === mode.value ? "var(--teal-light)" : "var(--bg-card)",
              cursor: disabled ? "not-allowed" : "pointer",
              textAlign: "left",
              transition: "all 0.2s ease",
              opacity: disabled ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!disabled && selectedMode !== mode.value) {
                e.currentTarget.style.borderColor = "var(--primary-teal)";
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled && selectedMode !== mode.value) {
                e.currentTarget.style.borderColor = "var(--border)";
              }
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              {mode.icon && <span style={{ color: selectedMode === mode.value ? "var(--primary-teal)" : "var(--text-muted)" }}>{mode.icon}</span>}
              <span style={{
                fontSize: "14px",
                fontWeight: 700,
                color: selectedMode === mode.value ? "var(--primary-teal)" : "var(--text-primary)",
              }}>
                {mode.label}
              </span>
              {selectedMode === mode.value && <Check size={18} style={{ color: "var(--primary-teal)" }} />}
            </div>
            <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
              {mode.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}