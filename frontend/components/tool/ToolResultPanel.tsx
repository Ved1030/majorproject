"use client";

import { ReactNode } from "react";
import ProcessingResult from "./ProcessingResult";

interface ToolResultPanelProps {
  file: Blob | File;
  filename: string;
  originalSize?: number;
  processedSize?: number;
  reductionPercent?: number;
  format?: string;
  mode?: string;
  onDownload: () => void;
  onReset: () => void;
  downloadLabel?: string;
  formatBytes?: (bytes: number) => string;
  extraInfo?: ReactNode;
}

export default function ToolResultPanel({
  file,
  filename,
  originalSize,
  processedSize,
  reductionPercent,
  format,
  mode,
  onDownload,
  onReset,
  downloadLabel = "Download",
  formatBytes,
  extraInfo,
}: ToolResultPanelProps) {
  return (
    <ProcessingResult
      file={file}
      filename={filename}
      originalSize={originalSize}
      processedSize={processedSize}
      reductionPercent={reductionPercent}
      format={format}
      mode={mode}
      onDownload={onDownload}
      onReset={onReset}
      downloadLabel={downloadLabel}
      formatBytes={formatBytes}
      extraInfo={extraInfo}
    />
  );
}
