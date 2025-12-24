import type { ToolMeta } from "./manifest-types";
import toolData from "./tools.generated.json";

export const TOOL_META: ToolMeta[] = toolData as ToolMeta[];

export const getToolMetaBySlug = (slug: string): ToolMeta | undefined =>
  TOOL_META.find((t) => t.slug === slug);

export const getToolsBySection = (sectionId: string): ToolMeta[] =>
  TOOL_META.filter((t) => t.section === sectionId);
