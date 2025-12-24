import Fuse from "fuse.js";
import {
  Binary,
  Calculator,
  Clock,
  Code,
  FileJson,
  GitCompare,
  Globe,
  Hash,
  Image,
  Link2,
  Lock,
  Palette,
  Type,
} from "lucide-react";
import { base64Tools } from "./sections/base64";
import { codeTools } from "./sections/code";
import { colorTools } from "./sections/colors";
import { cryptoTools } from "./sections/crypto";
import { datetimeTools } from "./sections/datetime";
import { diffTools } from "./sections/diff";
// Import all tool sections
import { encodingTools } from "./sections/encoding";
import { formatTools } from "./sections/formats";
import { httpTools } from "./sections/http";
import { idTools } from "./sections/ids";
import { imageTools } from "./sections/images";
import { numberTools } from "./sections/numbers";
import { textTools } from "./sections/text";
import type { ToolDefinition, ToolSection } from "./types";

export const SECTIONS: ToolSection[] = [
  {
    id: "encoding",
    name: "URL & Encoding",
    icon: Link2,
    description: "URL encode/decode, HTML entities, Unicode",
  },
  {
    id: "base64",
    name: "Base64 & Bytes",
    icon: Binary,
    description: "Base64, hex, binary conversions",
  },
  {
    id: "text",
    name: "Text Transforms",
    icon: Type,
    description: "Case, whitespace, sort, filter",
  },
  {
    id: "formats",
    name: "JSON, YAML, XML",
    icon: FileJson,
    description: "Format, validate, convert",
  },
  {
    id: "diff",
    name: "Diff & Compare",
    icon: GitCompare,
    description: "Text diff, JSON diff, similarity",
  },
  {
    id: "crypto",
    name: "Crypto & Hashing",
    icon: Lock,
    description: "Hash, HMAC, JWT, passwords",
  },
  {
    id: "ids",
    name: "IDs & Tokens",
    icon: Hash,
    description: "UUID, ULID, NanoID generators",
  },
  {
    id: "datetime",
    name: "Date & Time",
    icon: Clock,
    description: "Epoch, timezone, duration",
  },
  {
    id: "numbers",
    name: "Numbers & Bits",
    icon: Calculator,
    description: "Base converter, bitwise, IP",
  },
  {
    id: "http",
    name: "HTTP Helpers",
    icon: Globe,
    description: "Headers, cURL, status codes",
  },
  {
    id: "images",
    name: "Images & Media",
    icon: Image,
    description: "Compress, resize, QR codes",
  },
  {
    id: "colors",
    name: "Colors & CSS",
    icon: Palette,
    description: "Color convert, contrast, CSS",
  },
  {
    id: "code",
    name: "Code Cleanup",
    icon: Code,
    description: "Beautify, escape, minify",
  },
];

// Combine all tools
export const tools: ToolDefinition[] = [
  ...encodingTools,
  ...base64Tools,
  ...textTools,
  ...formatTools,
  ...diffTools,
  ...cryptoTools,
  ...idTools,
  ...datetimeTools,
  ...numberTools,
  ...httpTools,
  ...imageTools,
  ...colorTools,
  ...codeTools,
];

// Create fuse instance for fuzzy search
const fuse = new Fuse(tools, {
  keys: [
    { name: "name", weight: 2 },
    { name: "aliases", weight: 1.5 },
    { name: "description", weight: 1 },
  ],
  threshold: 0.4,
  includeScore: true,
});

export const getToolBySlug = (slug: string): ToolDefinition | undefined =>
  tools.find((t) => t.slug === slug);

export const getToolsBySection = (sectionId: string): ToolDefinition[] =>
  tools.filter((t) => t.section === sectionId);

export const getSectionById = (id: string): ToolSection | undefined =>
  SECTIONS.find((s) => s.id === id);

export const searchTools = (query: string): ToolDefinition[] => {
  const normalized = query.trim();
  if (!normalized) return tools;

  const results = fuse.search(normalized).map((result) => result.item);
  if (results.length > 0) return results;

  const lowered = normalized.toLowerCase();
  return tools.filter((tool) => {
    const nameMatch = tool.name.toLowerCase().includes(lowered);
    const descMatch = tool.description?.toLowerCase().includes(lowered);
    const aliasMatch = tool.aliases?.some((alias) =>
      alias.toLowerCase().includes(lowered),
    );
    return nameMatch || descMatch || aliasMatch;
  });
};
