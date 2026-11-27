"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowRight, FilePenLine, Loader2, RotateCcw } from "lucide-react";
import { ShareProcessedFileButton } from "@/components/seo/ProcessedFileShareCta";
import {
  describeTransferError,
  getEditorTarget,
  getEditorTargetLabel,
  openGeneratedFileInEditor,
} from "@/utils/editorHandoff";

interface PostProcessingActionsProps {
  file: Blob | File;
  filename: string;
  onReset: () => void;
  resetLabel?: string;
  showShare?: boolean;
  sourceTool?: string;
}

export default function PostProcessingActions({
  file,
  filename,
  onReset,
  resetLabel = "Process Another File",
  showShare = true,
  sourceTool,
}: PostProcessingActionsProps) {
  const [opening, setOpening] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const openingRef = useRef(false);

  const generatedFile = useMemo(
    () => ({
      blob: file,
      filename,
    }),
    [file, filename]
  );

  const target = useMemo(() => getEditorTarget(generatedFile), [generatedFile]);
  const shareFile = useMemo(
    () =>
      new File([file], filename, {
        type:
          file.type ||
          (target === "pdf"
            ? "application/pdf"
            : target === "word"
              ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              : "application/octet-stream"),
      }),
    [file, filename, target]
  );

  const handleEdit = async () => {
    if (openingRef.current) return;
    openingRef.current = true;
    setOpening(true);
    setEditorError(null);
    try {
      await openGeneratedFileInEditor(generatedFile, sourceTool);
    } catch (error) {
      setEditorError(describeTransferError(error));
    } finally {
      openingRef.current = false;
      setOpening(false);
    }
  };

  return (
    <div className="zd-post-actions">
      <div className={`zd-action-grid${target ? " zd-action-grid--with-edit" : ""}`}>
        {target && (
          <div className="zd-action-wrapper">
            <button
              type="button"
              onClick={handleEdit}
              disabled={opening}
              className="zd-action-card zd-action-card--edit"
              title={
                target === "pdf"
                  ? "Opens the generated PDF in ZipDrop's editor after conversion to an editable Word document"
                  : undefined
              }
            >
              <span className="zd-action-icon">
                {opening ? <Loader2 size={20} className="zd-spin" /> : <FilePenLine size={20} />}
              </span>
              <span className="zd-action-copy">
                <span className="zd-action-title">
                  {opening ? "Opening document..." : getEditorTargetLabel(target)}
                </span>
                <span className="zd-action-subtitle">
                  {target === "pdf"
                    ? "Open in the editor as an editable Word document"
                    : "Open the generated Word document in the editor"}
                </span>
              </span>
              <ArrowRight size={18} className="zd-action-arrow" />
            </button>
            {editorError && <p className="zd-action-error">{editorError}</p>}
          </div>
        )}

        {showShare && <ShareProcessedFileButton file={shareFile} />}
      </div>

      <button type="button" onClick={onReset} className="zd-action-card zd-action-card--reset">
        <RotateCcw size={17} />
        {resetLabel}
      </button>
    </div>
  );
}
