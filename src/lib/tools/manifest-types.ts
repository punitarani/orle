export type ToolOptionMeta = {
  id: string;
  label: string;
  type: "toggle" | "select" | "number" | "text";
  default: unknown;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  visibleWhen?: {
    optionId: string;
    equals: string | number | boolean | Array<string | number | boolean>;
  };
  enabledWhen?: {
    optionId: string;
    equals: string | number | boolean | Array<string | number | boolean>;
  };
  group?: string;
  advanced?: boolean;
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
  outputPlaceholder?: string;
  allowSwap?: boolean;
  acceptsFile?: boolean;
  fileAccept?: string;
  runPolicy?: "auto" | "manual";
  debounceMs?: number;
  canonicalSlug?: string;
  presetOptions?: Record<string, unknown>;
};

export type SectionMeta = {
  id: string;
  name: string;
  description?: string;
  icon: string;
};
