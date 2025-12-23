/**
 * Shared tool metadata - JSON-serializable format for both web and Raycast
 * This file contains no functions, only data structures
 */

export type ToolOptionMeta = {
  id: string;
  label: string;
  type: "toggle" | "select" | "number" | "text";
  default: unknown;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
};

export type ToolMeta = {
  slug: string;
  name: string;
  description: string;
  section: string;
  aliases: string[];
  inputType: "text" | "none" | "dual" | "file";
  outputType: string;
  options?: ToolOptionMeta[];
  inputPlaceholder?: string;
  allowSwap?: boolean;
  raycastCompatible: boolean;
};

export type SectionMeta = {
  id: string;
  name: string;
  description?: string;
  icon: string; // Icon name for Raycast
};

// Section metadata without React components
export const SECTION_META: SectionMeta[] = [
  {
    id: "encoding",
    name: "URL & Encoding",
    description: "URL encode/decode, HTML entities, Unicode",
    icon: "Link",
  },
  {
    id: "base64",
    name: "Base64 & Bytes",
    description: "Base64, hex, binary conversions",
    icon: "Document",
  },
  {
    id: "text",
    name: "Text Transforms",
    description: "Case, whitespace, sort, filter",
    icon: "Text",
  },
  {
    id: "formats",
    name: "JSON, YAML, XML",
    description: "Format, validate, convert",
    icon: "CodeBlock",
  },
  {
    id: "diff",
    name: "Diff & Compare",
    description: "Text diff, JSON diff, similarity",
    icon: "ArrowLeftRight",
  },
  {
    id: "crypto",
    name: "Crypto & Hashing",
    description: "Hash, HMAC, JWT, passwords",
    icon: "Lock",
  },
  {
    id: "ids",
    name: "IDs & Tokens",
    description: "UUID, ULID, NanoID generators",
    icon: "Hashtag",
  },
  {
    id: "datetime",
    name: "Date & Time",
    description: "Epoch, timezone, duration",
    icon: "Clock",
  },
  {
    id: "numbers",
    name: "Numbers & Bits",
    description: "Base converter, bitwise, IP",
    icon: "Calculator",
  },
  {
    id: "http",
    name: "HTTP Helpers",
    description: "Headers, cURL, status codes",
    icon: "Globe",
  },
  {
    id: "images",
    name: "Images & Media",
    description: "Compress, resize, QR codes",
    icon: "Image",
  },
  {
    id: "colors",
    name: "Colors & CSS",
    description: "Color convert, contrast, CSS",
    icon: "EyeDropper",
  },
  {
    id: "code",
    name: "Code Cleanup",
    description: "Beautify, escape, minify",
    icon: "Terminal",
  },
];

// Tools that work in Node.js (no browser APIs required)
// File-based and canvas-based tools are NOT compatible
const INCOMPATIBLE_SLUGS = new Set([
  // Image tools (require Canvas/browser)
  "image-compress",
  "image-resize",
  "image-convert",
  "image-metadata",
  "image-strip-metadata",
  "image-to-ico",
  "color-picker-image",
  "palette-extractor",
  "svg-minify",
  "qr-reader",
  // File-based tools
  "file-hash",
  "base64-file",
  "base64-image",
  "base64-image-preview",
]);

// Generate tool metadata from registry
import { tools } from "./registry";

export const TOOL_META: ToolMeta[] = tools.map((tool) => ({
  slug: tool.slug,
  name: tool.name,
  description: tool.description,
  section: tool.section,
  aliases: tool.aliases,
  inputType: tool.inputType,
  outputType: tool.outputType,
  options: tool.options?.map((opt) => ({
    id: opt.id,
    label: opt.label,
    type: opt.type,
    default: opt.default,
    options: opt.options,
    min: opt.min,
    max: opt.max,
    step: opt.step,
  })),
  inputPlaceholder: tool.inputPlaceholder,
  allowSwap: tool.allowSwap,
  raycastCompatible:
    !INCOMPATIBLE_SLUGS.has(tool.slug) && tool.inputType !== "file",
}));

// Get only Raycast-compatible tools
export const RAYCAST_TOOLS = TOOL_META.filter((t) => t.raycastCompatible);

// Get tools by section
export const getToolMetaBySection = (sectionId: string): ToolMeta[] =>
  TOOL_META.filter((t) => t.section === sectionId);

// Get section by ID
export const getSectionMeta = (id: string): SectionMeta | undefined =>
  SECTION_META.find((s) => s.id === id);
