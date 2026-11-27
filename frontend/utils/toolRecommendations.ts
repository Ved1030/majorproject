import {
  TOOL_REGISTRY,
  TOOL_REGISTRY_BY_ID,
  type RegisteredTool,
  type ToolCategoryId,
} from "@/config/toolRegistry";

export const RECOMMENDATION_COUNT = 6;

const CATEGORY_AFFINITY: Record<ToolCategoryId, readonly ToolCategoryId[]> = {
  pdf: ["office", "document", "compression"],
  office: ["document", "pdf", "editing"],
  image: ["compression", "pdf", "sharing"],
  document: ["office", "pdf", "editing"],
  compression: ["pdf", "image", "sharing"],
  editing: ["document", "office", "sharing"],
  sharing: ["compression", "pdf", "image"],
};

const REGISTRY_ORDER = new Map(TOOL_REGISTRY.map((tool, index) => [tool.id, index]));

function scoreCandidate(current: RegisteredTool, candidate: RegisteredTool): number {
  let score = 0;
  const currentInputs = new Set(current.inputFormats);
  const currentOutputs = new Set(current.outputFormats);

  const canUseGeneratedFile = candidate.inputFormats.some((format) => currentOutputs.has(format));
  const canRestoreOriginalFormat = candidate.outputFormats.some((format) => currentInputs.has(format));

  if (canUseGeneratedFile && canRestoreOriginalFormat) {
    score += 30;
  } else {
    if (canUseGeneratedFile) score += 18;
    if (canRestoreOriginalFormat) score += 12;
  }

  if (candidate.category === current.category) score += 8;
  if (CATEGORY_AFFINITY[current.category]?.includes(candidate.category)) score += 5;
  if (
    current.inputFormats.some((format) => candidate.inputFormats.includes(format)) ||
    current.outputFormats.some((format) => candidate.outputFormats.includes(format))
  ) {
    score += 2;
  }
  if (candidate.category === "compression" && current.category !== "compression") score += 3;
  if (candidate.id === "share-file") score += 1;

  return score;
}

export function getRecommendedTools(
  currentToolId: string,
  limit: number = RECOMMENDATION_COUNT,
): readonly RegisteredTool[] {
  const current = TOOL_REGISTRY_BY_ID.get(currentToolId);
  if (!current || limit <= 0) return [];

  const selected: RegisteredTool[] = [];
  const excludedIds = new Set<string>([current.id]);
  const excludedHrefs = new Set<string>([current.href]);

  for (const id of current.relatedToolIds) {
    const tool = TOOL_REGISTRY_BY_ID.get(id);
    if (!tool || excludedIds.has(id) || excludedHrefs.has(tool.href)) continue;
    selected.push(tool);
    excludedIds.add(id);
    excludedHrefs.add(tool.href);
    if (selected.length >= limit) break;
  }

  if (selected.length < limit) {
    const ranked = TOOL_REGISTRY.filter(
      (tool) => !excludedIds.has(tool.id) && !excludedHrefs.has(tool.href),
    )
      .map((tool) => ({ tool, score: scoreCandidate(current, tool) }))
      .sort(
        (a, b) =>
          b.score - a.score ||
          (REGISTRY_ORDER.get(a.tool.id) ?? 0) - (REGISTRY_ORDER.get(b.tool.id) ?? 0),
      );

    for (const { tool } of ranked) {
      if (selected.length >= limit) break;
      selected.push(tool);
      excludedIds.add(tool.id);
      excludedHrefs.add(tool.href);
    }
  }

  if (selected.length < limit && process.env.NODE_ENV !== "production") {
    console.warn(
      `Only ${selected.length} valid recommendations found for "${currentToolId}" (expected ${limit}).`,
    );
  }

  return selected.slice(0, limit);
}
