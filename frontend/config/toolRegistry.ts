import type { LucideIcon } from "lucide-react";
import { FileDown, Image as ImageIcon, Share2, Zap } from "lucide-react";
import { TOOL_CATEGORIES, type Tool } from "@/data/toolCategories";

export type ToolFormat =
  | "pdf"
  | "pdfa"
  | "docx"
  | "doc"
  | "xlsx"
  | "xls"
  | "csv"
  | "pptx"
  | "ppt"
  | "txt"
  | "html"
  | "rtf"
  | "jpg"
  | "png"
  | "webp"
  | "svg"
  | "image";

export type ToolCategoryId =
  | "pdf"
  | "office"
  | "image"
  | "document"
  | "compression"
  | "editing"
  | "sharing";

export interface RegisteredTool {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  iconColor: string;
  category: ToolCategoryId;
  inputFormats: readonly ToolFormat[];
  outputFormats: readonly ToolFormat[];
  relatedToolIds: readonly string[];
}

interface ToolMetadata {
  category: ToolCategoryId;
  inputFormats: readonly ToolFormat[];
  outputFormats: readonly ToolFormat[];
  relatedToolIds: readonly string[];
}

const TOOL_METADATA: Record<string, ToolMetadata> = {
  "pdf-to-word": {
    category: "document",
    inputFormats: ["pdf"],
    outputFormats: ["docx", "doc"],
    relatedToolIds: ["word-to-pdf", "compress-pdf", "pdf-to-excel", "pdf-to-jpg", "merge-pdf", "split-pdf"],
  },
  "pdf-to-excel": {
    category: "document",
    inputFormats: ["pdf"],
    outputFormats: ["xlsx", "xls"],
    relatedToolIds: ["excel-to-pdf", "excel-to-csv", "pdf-to-word", "compress-pdf", "pdf-to-txt", "merge-pdf"],
  },
  "pdf-to-ppt": {
    category: "document",
    inputFormats: ["pdf"],
    outputFormats: ["pptx"],
    relatedToolIds: ["ppt-to-pdf", "pdf-to-word", "pdf-to-jpg", "compress-pdf", "merge-pdf", "split-pdf"],
  },
  "pdf-to-jpg": {
    category: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["jpg"],
    relatedToolIds: ["pdf-to-png", "jpg-to-pdf", "compress-jpg", "jpg-to-png", "compress-pdf", "merge-pdf"],
  },
  "pdf-to-png": {
    category: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["png"],
    relatedToolIds: ["pdf-to-jpg", "png-to-pdf", "compress-png", "png-to-jpg", "png-to-webp", "compress-pdf"],
  },
  "pdf-to-txt": {
    category: "document",
    inputFormats: ["pdf"],
    outputFormats: ["txt"],
    relatedToolIds: ["txt-to-pdf", "pdf-to-word", "pdf-to-excel", "pdf-to-jpg", "compress-pdf", "merge-pdf"],
  },
  "pdf-to-html": {
    category: "document",
    inputFormats: ["pdf"],
    outputFormats: ["html"],
    relatedToolIds: ["html-to-pdf", "pdf-to-word", "pdf-to-txt", "pdf-to-jpg", "compress-pdf", "merge-pdf"],
  },
  "pdf-to-pdfa": {
    category: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdfa"],
    relatedToolIds: ["compress-pdf", "pdf-to-word", "pdf-to-jpg", "merge-pdf", "split-pdf", "organize-pdf"],
  },
  "word-to-pdf": {
    category: "office",
    inputFormats: ["docx", "doc"],
    outputFormats: ["pdf"],
    relatedToolIds: ["pdf-to-word", "compress-pdf", "merge-pdf", "split-pdf", "pdf-to-jpg", "organize-pdf"],
  },
  "excel-to-pdf": {
    category: "office",
    inputFormats: ["xlsx", "xls"],
    outputFormats: ["pdf"],
    relatedToolIds: ["pdf-to-excel", "excel-to-csv", "csv-to-excel", "compress-pdf", "merge-pdf", "split-pdf"],
  },
  "ppt-to-pdf": {
    category: "office",
    inputFormats: ["pptx", "ppt"],
    outputFormats: ["pdf"],
    relatedToolIds: ["pdf-to-ppt", "compress-pdf", "pdf-to-jpg", "pdf-to-png", "merge-pdf", "split-pdf"],
  },
  "word-to-txt": {
    category: "document",
    inputFormats: ["docx", "doc"],
    outputFormats: ["txt"],
    relatedToolIds: ["txt-to-pdf", "word-to-pdf", "pdf-to-word", "word-editor", "word-to-html", "pdf-to-txt"],
  },
  "word-to-html": {
    category: "document",
    inputFormats: ["docx", "doc"],
    outputFormats: ["html"],
    relatedToolIds: ["html-to-pdf", "word-to-txt", "pdf-to-word", "word-editor", "word-to-pdf", "pdf-to-html"],
  },
  "excel-to-csv": {
    category: "office",
    inputFormats: ["xlsx", "xls"],
    outputFormats: ["csv"],
    relatedToolIds: ["csv-to-excel", "excel-to-pdf", "pdf-to-excel", "pdf-to-word", "share-file", "merge-pdf"],
  },
  "csv-to-excel": {
    category: "office",
    inputFormats: ["csv"],
    outputFormats: ["xlsx"],
    relatedToolIds: ["excel-to-csv", "excel-to-pdf", "pdf-to-excel", "pdf-to-word", "share-file", "merge-pdf"],
  },
  "rtf-to-word": {
    category: "document",
    inputFormats: ["rtf"],
    outputFormats: ["docx"],
    relatedToolIds: ["word-editor", "word-to-pdf", "word-to-txt", "word-to-html", "pdf-to-word", "share-file"],
  },
  "jpg-to-png": {
    category: "image",
    inputFormats: ["jpg"],
    outputFormats: ["png"],
    relatedToolIds: ["png-to-jpg", "compress-jpg", "compress-png", "jpg-to-pdf", "jpg-to-webp", "remove-background"],
  },
  "png-to-jpg": {
    category: "image",
    inputFormats: ["png"],
    outputFormats: ["jpg"],
    relatedToolIds: ["jpg-to-png", "compress-png", "compress-jpg", "png-to-pdf", "png-to-webp", "remove-background"],
  },
  "jpg-to-webp": {
    category: "image",
    inputFormats: ["jpg"],
    outputFormats: ["webp"],
    relatedToolIds: ["webp-to-jpg", "jpg-to-png", "compress-webp", "compress-jpg", "jpg-to-pdf", "remove-background"],
  },
  "png-to-webp": {
    category: "image",
    inputFormats: ["png"],
    outputFormats: ["webp"],
    relatedToolIds: ["webp-to-jpg", "png-to-jpg", "compress-webp", "compress-png", "png-to-pdf", "remove-background"],
  },
  "webp-to-jpg": {
    category: "image",
    inputFormats: ["webp"],
    outputFormats: ["jpg"],
    relatedToolIds: ["jpg-to-webp", "jpg-to-png", "compress-webp", "compress-jpg", "jpg-to-pdf", "remove-background"],
  },
  "svg-to-png": {
    category: "image",
    inputFormats: ["svg"],
    outputFormats: ["png"],
    relatedToolIds: ["png-to-jpg", "png-to-webp", "compress-png", "remove-background", "png-to-pdf", "compress-image"],
  },
  "jpg-to-pdf": {
    category: "image",
    inputFormats: ["jpg"],
    outputFormats: ["pdf"],
    relatedToolIds: ["pdf-to-jpg", "jpg-to-png", "compress-jpg", "compress-pdf", "merge-pdf", "split-pdf"],
  },
  "png-to-pdf": {
    category: "image",
    inputFormats: ["png"],
    outputFormats: ["pdf"],
    relatedToolIds: ["pdf-to-png", "png-to-jpg", "compress-png", "compress-pdf", "merge-pdf", "split-pdf"],
  },
  "images-to-pdf": {
    category: "image",
    inputFormats: ["image"],
    outputFormats: ["pdf"],
    relatedToolIds: ["pdf-to-jpg", "pdf-to-png", "compress-pdf", "merge-pdf", "split-pdf", "organize-pdf"],
  },
  "txt-to-pdf": {
    category: "document",
    inputFormats: ["txt"],
    outputFormats: ["pdf"],
    relatedToolIds: ["pdf-to-txt", "word-editor", "compress-pdf", "merge-pdf", "split-pdf", "pdf-to-word"],
  },
  "html-to-pdf": {
    category: "document",
    inputFormats: ["html"],
    outputFormats: ["pdf"],
    relatedToolIds: ["pdf-to-html", "word-to-html", "compress-pdf", "merge-pdf", "split-pdf", "pdf-to-word"],
  },
  "merge-pdf": {
    category: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    relatedToolIds: ["split-pdf", "organize-pdf", "compress-pdf", "pdf-to-word", "pdf-to-jpg", "pdf-to-png"],
  },
  "split-pdf": {
    category: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    relatedToolIds: ["merge-pdf", "organize-pdf", "compress-pdf", "pdf-to-word", "pdf-to-jpg", "pdf-to-png"],
  },
  "organize-pdf": {
    category: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    relatedToolIds: ["merge-pdf", "split-pdf", "compress-pdf", "pdf-to-word", "pdf-to-jpg", "pdf-to-png"],
  },
  "compress-pdf": {
    category: "compression",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    relatedToolIds: ["merge-pdf", "split-pdf", "organize-pdf", "pdf-to-word", "pdf-to-jpg", "pdf-to-png"],
  },
  "compress-pdf-under-100kb": {
    category: "compression",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    relatedToolIds: ["compress-pdf", "split-pdf", "pdf-to-word", "pdf-to-jpg", "organize-pdf", "share-file"],
  },
  "compress-jpg": {
    category: "compression",
    inputFormats: ["jpg"],
    outputFormats: ["jpg"],
    relatedToolIds: ["jpg-to-png", "jpg-to-webp", "jpg-to-pdf", "compress-png", "compress-webp", "remove-background"],
  },
  "compress-png": {
    category: "compression",
    inputFormats: ["png"],
    outputFormats: ["png"],
    relatedToolIds: ["png-to-jpg", "png-to-webp", "png-to-pdf", "compress-jpg", "compress-webp", "remove-background"],
  },
  "compress-webp": {
    category: "compression",
    inputFormats: ["webp"],
    outputFormats: ["webp"],
    relatedToolIds: ["webp-to-jpg", "jpg-to-webp", "png-to-webp", "compress-jpg", "compress-png", "remove-background"],
  },
  "compress-image": {
    category: "compression",
    inputFormats: ["jpg", "png", "webp"],
    outputFormats: ["jpg", "png", "webp"],
    relatedToolIds: ["compress-jpg", "compress-png", "compress-webp", "jpg-to-png", "png-to-webp", "remove-background"],
  },
  "remove-background": {
    category: "image",
    inputFormats: ["jpg", "png", "webp"],
    outputFormats: ["png"],
    relatedToolIds: ["compress-png", "png-to-jpg", "png-to-webp", "jpg-to-png", "compress-webp", "png-to-pdf"],
  },
  "word-editor": {
    category: "editing",
    inputFormats: ["docx", "doc"],
    outputFormats: ["docx"],
    relatedToolIds: ["word-to-pdf", "pdf-to-word", "word-to-txt", "word-to-html", "share-file", "rtf-to-word"],
  },
  "share-file": {
    category: "sharing",
    inputFormats: ["pdf", "docx", "xlsx", "jpg", "png", "webp", "txt"],
    outputFormats: [],
    relatedToolIds: ["compress-pdf", "compress-image", "pdf-to-word", "remove-background", "merge-pdf", "word-editor"],
  },
};

const EXTRA_TOOLS: Tool[] = [
  {
    id: "compress-image",
    name: "Compress Image",
    description: "Reduce JPG, PNG and WEBP image sizes",
    href: "/compression/compress-image",
    icon: ImageIcon,
    iconColor: "#9152D4",
    available: true,
  },
  {
    id: "compress-pdf-under-100kb",
    name: "Compress PDF Under 100KB",
    description: "Shrink a PDF to meet a strict 100KB limit",
    href: "/compress-pdf-under-100kb",
    icon: FileDown,
    iconColor: "#E45B55",
    available: true,
  },
  {
    id: "share-file",
    name: "Share File",
    description: "Send files and text with a private 4-digit code",
    href: "/#share-receive",
    icon: Share2,
    iconColor: "#078C91",
    available: true,
  },
];

const SOURCE_TOOLS: Tool[] = [
  ...TOOL_CATEGORIES.flatMap((category) => category.groups.flatMap((group) => group.tools)),
  ...EXTRA_TOOLS,
];

function buildRegistry(): RegisteredTool[] {
  const seenIds = new Set<string>();
  const seenHrefs = new Set<string>();
  const registry: RegisteredTool[] = [];

  for (const [id, metadata] of Object.entries(TOOL_METADATA)) {
    const source = SOURCE_TOOLS.find((tool) => tool.id === id);
    if (!source || seenIds.has(id) || seenHrefs.has(source.href)) continue;

    seenIds.add(id);
    seenHrefs.add(source.href);
    registry.push({
      id,
      name: source.name,
      description: source.description,
      href: source.href,
      icon: source.icon ?? Zap,
      iconColor: source.iconColor ?? "var(--primary-teal)",
      category: metadata.category,
      inputFormats: metadata.inputFormats,
      outputFormats: metadata.outputFormats,
      relatedToolIds: metadata.relatedToolIds,
    });
  }

  return registry;
}

export const TOOL_REGISTRY: readonly RegisteredTool[] = buildRegistry();

export const TOOL_REGISTRY_BY_ID: ReadonlyMap<string, RegisteredTool> = new Map(
  TOOL_REGISTRY.map((tool) => [tool.id, tool]),
);

export function getRegisteredTool(id: string): RegisteredTool | undefined {
  return TOOL_REGISTRY_BY_ID.get(id);
}

export function getAvailableTools(): readonly RegisteredTool[] {
  return TOOL_REGISTRY;
}
