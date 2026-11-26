"use client";

const PRESETS = [100, 200, 500];

export interface TargetSizePresetsProps {
  value: number | null;
  onChange: (targetKb: number | null) => void;
  disabled?: boolean;
}

export default function TargetSizePresets({
  value,
  onChange,
  disabled = false,
}: TargetSizePresetsProps) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <span
        style={{
          display: "block",
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "10px",
        }}
      >
        Target size presets
      </span>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {PRESETS.map((preset) => {
          const selected = value === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(selected ? null : preset)}
              disabled={disabled}
              aria-pressed={selected}
              style={{
                padding: "10px 16px",
                borderRadius: "10px",
                border: `2px solid ${selected ? "var(--primary-teal)" : "var(--border)"}`,
                background: selected ? "var(--teal-light)" : "var(--bg-card)",
                color: selected ? "var(--primary-teal)" : "var(--text-secondary)",
                fontSize: "13px",
                fontWeight: 700,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
              }}
            >
              {preset} KB
            </button>
          );
        })}
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 10px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            fontSize: "13px",
            color: "var(--text-secondary)",
          }}
        >
          Custom
          <input
            type="number"
            min={1}
            max={10240}
            placeholder="KB"
            value={value && !PRESETS.includes(value) ? value : ""}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              onChange(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
            }}
            disabled={disabled}
            style={{
              width: "72px",
              padding: "6px 8px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: "var(--editor-workspace)",
              color: "var(--text-primary)",
              fontSize: "13px",
            }}
          />
        </label>
      </div>
      {value && (
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
          ZipDrop will try several settings and return the smallest usable file at or near {value} KB.
        </p>
      )}
    </div>
  );
}
