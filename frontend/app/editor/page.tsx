import type { Metadata } from "next";
import { Suspense } from "react";
import EditorPageClient from "./EditorPageClient";
import { SITE_URL } from "@/lib/site";

type EditorSearchParams = {
  code?: string | string[];
  fileUrl?: string | string[];
  filename?: string | string[];
  transfer?: string | string[];
};

function isPrivateShareView(searchParams: EditorSearchParams): boolean {
  return Boolean(searchParams.code || searchParams.fileUrl || searchParams.transfer);
}

export function generateMetadata({
  searchParams,
}: {
  searchParams: EditorSearchParams;
}): Metadata {
  if (isPrivateShareView(searchParams)) {
    return {
      title: "Open Shared Document",
      robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
          index: false,
          follow: false,
          noimageindex: true,
          nosnippet: true,
        },
      },
      alternates: {
        canonical: `${SITE_URL}/editor`,
      },
    };
  }

  return {};
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--editor-workspace)" }}>
          <div style={{ width: 40, height: 40, border: "2px solid var(--teal-light)", borderTop: "2px solid #078C91", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
      }
    >
      <EditorPageClient />
    </Suspense>
  );
}
