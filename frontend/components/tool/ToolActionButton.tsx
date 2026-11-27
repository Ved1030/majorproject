"use client";

import { ReactNode } from "react";

interface ToolActionButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  progress?: number;
  icon?: ReactNode;
  loadingIcon?: ReactNode;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  className?: string;
}

export default function ToolActionButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  loadingText,
  progress,
  icon,
  loadingIcon,
  variant = "primary",
  fullWidth = true,
  className = "",
}: ToolActionButtonProps) {
  const isDisabled = disabled || loading;

  if (variant === "primary") {
    return (
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={`btn-cyan ${className}`}
        style={{
          width: fullWidth ? "100%" : "auto",
          padding: "16px 24px",
          fontSize: "15px",
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          opacity: isDisabled ? 0.5 : 1,
          cursor: isDisabled ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <span className="shimmer" />
        {loading ? (
          <>
            {loadingIcon || (
              <svg
                className="animate-spin"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                style={{ animation: "spin 1s linear infinite" }}
              >
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="1" strokeLinecap="round" />
              </svg>
            )}
            {loadingText || (progress !== undefined ? `Processing... ${progress}%` : "Processing...")}
          </>
        ) : (
          <>
            {icon && <span>{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`btn-ghost ${className}`}
      style={{
        width: fullWidth ? "100%" : "auto",
        padding: "16px 24px",
        fontSize: "15px",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
    >
      {loading ? (
        <>
          {loadingIcon || (
            <svg
              className="animate-spin"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ animation: "spin 1s linear infinite" }}
            >
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="1" strokeLinecap="round" />
            </svg>
          )}
          {loadingText || "Processing..."}
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}