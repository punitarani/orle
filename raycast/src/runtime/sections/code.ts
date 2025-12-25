import parserBabel from "prettier/parser-babel";
import parserHtml from "prettier/parser-html";
import parserMarkdown from "prettier/parser-markdown";
import parserPostcss from "prettier/parser-postcss";
import parserTypescript from "prettier/parser-typescript";
import prettier from "prettier/standalone";
import { format as formatSQL } from "sql-formatter";
import { minify } from "terser";
import type { ToolDefinition } from "../types";

export const codeTools: ToolDefinition[] = [
  {
    slug: "code-suite",
    name: "Code Cleanup Suite",
    description: "Format, minify, and escape code",
    section: "code",
    aliases: ["format", "prettier", "minify", "sql"],
    inputType: "text",
    outputType: "text",
    runPolicy: "manual",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "format",
        options: [
          { value: "format", label: "Prettier format" },
          { value: "minify", label: "Minify JS" },
          { value: "sql", label: "Format SQL" },
          { value: "escape", label: "Escape JS" },
          { value: "unescape", label: "Unescape JS" },
        ],
      },
      {
        id: "language",
        label: "Language",
        type: "select",
        default: "javascript",
        options: [
          { value: "javascript", label: "JavaScript" },
          { value: "typescript", label: "TypeScript" },
          { value: "html", label: "HTML" },
          { value: "css", label: "CSS" },
          { value: "markdown", label: "Markdown" },
        ],
        visibleWhen: { optionId: "mode", equals: "format" },
      },
    ],
    transform: async (input, opts) => {
      const text = String(input ?? "");
      const mode = String(opts.mode);

      switch (mode) {
        case "format": {
          try {
            const parser = parserForLanguage(
              String(opts.language || "javascript"),
            );
            return prettier.format(text, {
              parser,
              plugins: [
                parserBabel,
                parserTypescript,
                parserHtml,
                parserPostcss,
                parserMarkdown,
              ],
            });
          } catch (error) {
            return { type: "error", message: (error as Error).message };
          }
        }
        case "minify": {
          const result = await minify(text);
          if (
            typeof result === "object" &&
            result &&
            "error" in result &&
            result.error
          ) {
            return { type: "error", message: String(result.error) };
          }
          return result.code || "";
        }
        case "sql":
          return formatSQL(text);
        case "escape":
          return text.replace(/[\\"'\n\r\t]/g, (char) => {
            switch (char) {
              case "\\":
                return "\\\\";
              case '"':
                return '\\"';
              case "'":
                return "\\'";
              case "\n":
                return "\\n";
              case "\r":
                return "\\r";
              case "\t":
                return "\\t";
              default:
                return char;
            }
          });
        case "unescape":
          return text
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "\r")
            .replace(/\\t/g, "\t")
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'")
            .replace(/\\\\/g, "\\");
        default:
          return "";
      }
    },
  },
];

function parserForLanguage(language: string): string {
  switch (language) {
    case "typescript":
      return "typescript";
    case "html":
      return "html";
    case "css":
      return "css";
    case "markdown":
      return "markdown";
    default:
      return "babel";
  }
}
