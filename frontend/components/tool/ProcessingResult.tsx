"use client";

import { ReactNode } from "react";
import { Check, Download } from "lucide-react";
import PostProcessingActions from "./PostProcessingActions";

interface ProcessingResultProps {
  file: Blob | File;
  filename: string;
  format?: string;
  mode?: string;
  sizeBytes?: number;
  originalSize?: number;
  processedSize?: number;
  reductionPercent?: number;
  statusLabel?: string;
  downloadLabel?: string;
  resetLabel?: string;
  formatBytes?: (bytes: number) => string;
  onDownload: () => void;
  onReset: () => void;
  extraInfo?: ReactNode;
  showShare?: boolean;
}

function defaultFormatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProcessingResult({
  file,
  filename,
  format,
  mode,
  sizeBytes,
  originalSize,
  processedSize,
  reductionPercent,
  statusLabel = "Processing complete",
  downloadLabel = "Download",
  resetLabel,
  formatBytes = defaultFormatBytes,
  onDownload,
  onReset,
  extraInfo,
  showShare,
}: ProcessingResultProps) {
  const outputSize = sizeBytes ?? file.size;

  return (
    <div className="zd-processing-result animate-scaleIn">
      <div className="zd-result-head">
        <div className="zd-result-summary">
          <span className="zd-result-check">
            <Check size={22} />
          </span>
          <div className="zd-result-copy">
            <p className="zd-result-title">{statusLabel}</p>
            <div className="zd-result-meta">
              <span className="zd-result-filename" title={filename}>
                {filename}
              </span>
              {format && <span>{format}</span>}
              {outputSize > 0 && <span>{formatBytes(outputSize)}</span>}
              {mode && <span>{mode} mode</span>}
              {originalSize && processedSize && (
                <span>
                  {formatBytes(originalSize)} → {formatBytes(processedSize)}
                </span>
              )}
              {reductionPercent !== undefined && (
                <span className="zd-result-reduction">{reductionPercent}% reduction</span>
              )}
            </div>
          </div>
        </div>
        <button type="button" onClick={onDownload} className="btn-cyan zd-result-download">
          <Download size={19} />
          {downloadLabel}
        </button>
      </div>

      {extraInfo && <div className="zd-result-extra">{extraInfo}</div>}

      <div className="zd-result-divider" />

      <PostProcessingActions
        file={file}
        filename={filename}
        onReset={onReset}
        resetLabel={resetLabel}
        showShare={showShare}
      />
    </div>
  );
}
