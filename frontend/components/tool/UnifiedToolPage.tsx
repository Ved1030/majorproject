"use client";

import { ReactNode } from "react";
import { Lock } from "lucide-react";
import RecommendedTools from "@/components/recommendations/RecommendedTools";

interface UnifiedToolPageProps {
  header: ReactNode;
  upload: ReactNode;
  controls?: ReactNode;
  action: ReactNode;
  instructions?: ReactNode;
  privacy?: ReactNode;
  result?: ReactNode;
  footer?: ReactNode;
  showFooterMessage?: boolean;
  toolId?: string;
}

export default function UnifiedToolPage({
  header,
  upload,
  controls,
  action,
  instructions,
  privacy,
  result,
  footer,
  showFooterMessage = true,
  toolId,
}: UnifiedToolPageProps) {
  return (
    <main className="zd-tool-shell">
      <div className="zd-tool-container">
        {header}

        <div className={`zd-tool-workspace${result ? " zd-tool-workspace--with-result" : ""}`}>
          <section className="zd-tool-card zd-tool-upload-card" aria-label="File workspace">
            {upload}
          </section>

          <aside className="zd-tool-card zd-tool-control-card" aria-label="Tool controls">
            {controls && <div className="zd-tool-settings">{controls}</div>}
            <div className="zd-tool-action">{action}</div>
            {instructions && <div className="zd-tool-instructions">{instructions}</div>}
            {privacy && <div className="zd-tool-privacy">{privacy}</div>}
          </aside>

          {result && (
            <div className="zd-tool-result-card">
              <div className="zd-tool-result-inner">{result}</div>
            </div>
          )}
        </div>

        {showFooterMessage && (
          <div className="zd-tool-footer-message">
            <Lock size={13} aria-hidden="true" />
            Files are processed securely and deleted after conversion. No permanent storage.
          </div>
        )}
        {footer}
        {toolId && <RecommendedTools toolId={toolId} />}
      </div>
    </main>
  );
}
