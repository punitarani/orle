import type { ToolDefinition } from "../types";

export const regexTools: ToolDefinition[] = [
  {
    slug: "regex-suite",
    name: "Regex Suite",
    description: "Test, replace, and extract with regex",
    section: "regex",
    aliases: ["regex", "regexp"],
    inputType: "text",
    outputType: "text",
    runPolicy: "manual",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "match",
        options: [
          { value: "match", label: "Match tester" },
          { value: "replace", label: "Replace" },
          { value: "extract", label: "Extract matches" },
          { value: "explain", label: "Explain pattern" },
        ],
      },
      { id: "pattern", label: "Pattern", type: "text", default: "" },
      { id: "flags", label: "Flags", type: "text", default: "g" },
      {
        id: "replacement",
        label: "Replacement",
        type: "text",
        default: "",
        visibleWhen: { optionId: "mode", equals: "replace" },
      },
    ],
    transform: (input, opts) => {
      const text = String(input ?? "");
      const pattern = String(opts.pattern || "");
      const flags = String(opts.flags || "g");
      if (!pattern) return "";
      const mode = String(opts.mode);
      if (mode === "explain") {
        return explainRegex(pattern);
      }

      try {
        const regex = new RegExp(pattern, flags);
        if (mode === "replace") {
          return text.replace(regex, String(opts.replacement || ""));
        }
        const matches = Array.from(text.matchAll(regex));
        if (matches.length === 0) return "No matches";
        return matches
          .map((match, index) => {
            const groups = match.slice(1).filter(Boolean).join(" | ");
            return groups
              ? `#${index + 1}: ${match[0]} (groups: ${groups})`
              : `#${index + 1}: ${match[0]}`;
          })
          .join("\n");
      } catch (error) {
        return { type: "error", message: (error as Error).message };
      }
    },
  },
];

function explainRegex(pattern: string): string {
  const lines: string[] = [];
  const tokens: Array<{ token: string; meaning: string; test?: RegExp }> = [
    { token: "^", meaning: "Start of input" },
    { token: "$", meaning: "End of input" },
    { token: "\\d", meaning: "Digit (0-9)", test: /\\d/ },
    { token: "\\D", meaning: "Non-digit", test: /\\D/ },
    { token: "\\w", meaning: "Word character", test: /\\w/ },
    { token: "\\W", meaning: "Non-word character", test: /\\W/ },
    { token: "\\s", meaning: "Whitespace", test: /\\s/ },
    { token: "\\S", meaning: "Non-whitespace", test: /\\S/ },
    { token: ".", meaning: "Any character" },
    { token: "?", meaning: "Optional (0 or 1)" },
    { token: "*", meaning: "Zero or more" },
    { token: "+", meaning: "One or more" },
    { token: "|", meaning: "Alternation" },
    { token: "()", meaning: "Capture group", test: /\((?!\?)/ },
    { token: "(?:)", meaning: "Non-capturing group", test: /\(\?:/ },
    { token: "[]", meaning: "Character class", test: /\[[^\]]+\]/ },
    { token: "{}", meaning: "Quantifier range", test: /\{\d+(?:,\d*)?\}/ },
  ];

  lines.push("Pattern tokens:");
  tokens.forEach((token) => {
    const matches = token.test
      ? token.test.test(pattern)
      : pattern.includes(token.token);
    if (matches) lines.push(`- ${token.token}: ${token.meaning}`);
  });

  const groupCount = (pattern.match(/\((?!\?)/g) || []).length;
  if (groupCount) lines.push(`Capture groups: ${groupCount}`);

  const charClasses = pattern.match(/\[[^\]]+\]/g);
  if (charClasses?.length) {
    lines.push("Character classes:");
    for (const cls of charClasses) {
      lines.push(`- ${cls}`);
    }
  }

  return lines.join("\n");
}
