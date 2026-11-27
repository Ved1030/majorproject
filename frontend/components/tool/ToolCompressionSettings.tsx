"use client";

import { ReactNode } from "react";
import { Check } from "lucide-react";

interface PresetOption {
  value: number | null;
  label: string;
  description?: string;
}

interface LevelOption {
  value: string;
  label: string;
  description: string;
}

interface ToolCompressionSettingsProps {
  presets?: PresetOption[];
  selectedPreset: number | null;
  onPresetChange: (value: number | null) => void;
  levels?: LevelOption[];
  selectedLevel: string;
  onLevelChange: (value: string) => void;
  disabled?: boolean;
  helperText?: string;
  showCustomInput?: boolean;
  customTargetKb?: number;
  onCustomTargetChange?: (value: number) => void;
}

export default function ToolCompressionSettings({
  presets = [],
  selectedPreset,
  onPresetChange,
  levels = [],
  selectedLevel,
  onLevelChange,
  disabled = false,
  helperText,
  showCustomInput = false,
  customTargetKb,
  onCustomTargetChange,
}: ToolCompressionSettingsProps) {
  const outerStyle = { display: "flex", flexDirection: "column", gap: "20px" } as const;

  const presetButtons = presets.map((preset) => {
    const isSelected = selectedPreset === preset.value;
    const borderColor = isSelected ? "var(--primary-teal)" : "var(--border)";
    const bgColor = isSelected ? "var(--teal-light)" : "var(--bg-card)";
    const textColor = isSelected ? "var(--primary-teal)" : "var(--text-primary)";

    return (
      <button
        key={preset.value}
        onClick={() => !disabled && onPresetChange(preset.value)}
        disabled={disabled}
        style={{
          flex: 1,
          minWidth: "min(120px, 100%)",
          padding: "14px 18px",
          borderRadius: "12px",
          border: "2px solid " + borderColor,
          background: bgColor,
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "center",
          transition: "all 0.2s ease",
          opacity: disabled ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isSelected) {
            e.currentTarget.style.borderColor = "var(--primary-teal)";
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isSelected) {
            e.currentTarget.style.borderColor = "var(--border)";
          }
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: 700, color: textColor }}>
          {preset.label}
        </span>
        {preset.description && (
          <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
            {preset.description}
          </span>
        )}
      </button>
    );
  });

  const customInput = showCustomInput ? (
    <div style={{ flex: 1, minWidth: "120px" }}>
      <input
        type="number"
        min="1"
        value={customTargetKb || ""}
        onChange={(e) => onCustomTargetChange?.(parseInt(e.target.value) || 0)}
        disabled={disabled}
        placeholder="Custom KB"
        style={{
          width: "100%",
          padding: "14px 16px",
          borderRadius: "12px",
          border: "2px solid " + (customTargetKb ? "var(--primary-teal)" : "var(--border)"),
          background: customTargetKb ? "var(--teal-light)" : "var(--bg-card)",
          fontSize: "14px",
          fontWeight: 600,
          color: customTargetKb ? "var(--primary-teal)" : "var(--text-primary)",
          outline: "none",
          transition: "all 0.2s ease",
        }}
      />
    </div>
  ) : null;

  const levelButtons = levels.map((level) => {
    const isSelected = selectedLevel === level.value;
    const borderColor = isSelected ? "var(--primary-teal)" : "var(--border)";
    const bgColor = isSelected ? "var(--teal-light)" : "var(--bg-card)";
    const textColor = isSelected ? "var(--primary-teal)" : "var(--text-primary)";
    const checkBorderColor = isSelected ? "var(--primary-teal)" : "var(--text-muted)";
    const checkBgColor = isSelected ? "var(--primary-teal)" : "transparent";

    return (
      <button
        key={level.value}
        onClick={() => !disabled && onLevelChange(level.value)}
        disabled={disabled}
        style={{
          padding: "16px 20px",
          borderRadius: "12px",
          border: "2px solid " + borderColor,
          background: bgColor,
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "left",
          transition: "all 0.2s ease",
          opacity: disabled ? 0.6 : 1,
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isSelected) {
            e.currentTarget.style.borderColor = "var(--primary-teal)";
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isSelected) {
            e.currentTarget.style.borderColor = "var(--border)";
          }
        }}
      >
        <div style={{ width: "24px", height: "24px", borderRadius: "6px", border: "2px solid " + checkBorderColor, background: checkBgColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {isSelected && <Check size={14} style={{ color: "white" }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: textColor }}>
              {level.label}
            </span>
          </div>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
            {level.description}
          </p>
        </div>
      </button>
    );
  });

  const helperElement = helperText ? (
    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "10px" }}>
      {helperText}
    </p>
  ) : null;

  return (
    <div style={outerStyle}>
      {presets.length > 0 && (
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Target Size Presets
          </label>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {presetButtons}
            {customInput}
          </div>
        </div>
      )}

      {levels.length > 0 && (
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Compression Level
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {levelButtons}
          </div>
          {helperElement}
        </div>
      )}
    </div>
  );
}