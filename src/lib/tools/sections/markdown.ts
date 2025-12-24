import DOMPurify from "dompurify";
import { marked } from "marked";
import TurndownService from "turndown";
import type { ToolDefinition } from "../types";

export const markdownTools: ToolDefinition[] = [
  {
    slug: "markdown-suite",
    name: "Markdown & Docs Suite",
    description: "Convert and format Markdown/HTML",
    section: "markdown",
    aliases: ["markdown", "md", "html"],
    inputType: "text",
    outputType: "text",
    runPolicy: "manual",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "md-to-html",
        options: [
          { value: "md-to-html", label: "Markdown → HTML" },
          { value: "html-to-md", label: "HTML → Markdown" },
          { value: "md-table", label: "Markdown table format" },
        ],
      },
    ],
    transform: (input, opts) => {
      const text = String(input ?? "");
      const mode = String(opts.mode);
      if (!text) return "";

      if (mode === "html-to-md") {
        const turndown = new TurndownService();
        return turndown.turndown(text);
      }

      if (mode === "md-table") {
        return formatMarkdownTables(text);
      }

      const html = marked.parse(text);
      if (typeof html !== "string") {
        return { type: "error", message: "Markdown parsing failed" };
      }
      return DOMPurify.sanitize(html);
    },
  },
];

function formatMarkdownTables(input: string): string {
  const lines = input.split(/\r?\n/);
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const next = lines[i + 1];
    if (line && next && isTableRow(line) && isTableSeparator(next)) {
      const block: string[] = [line, next];
      let j = i + 2;
      while (j < lines.length && isTableRow(lines[j])) {
        block.push(lines[j]);
        j += 1;
      }
      output.push(...formatTableBlock(block));
      i = j;
      continue;
    }
    output.push(line);
    i += 1;
  }
  return output.join("\n");
}

function isTableRow(line: string): boolean {
  return line.includes("|");
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?[\s:-]+\|[\s|:-]*\s*$/.test(line);
}

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function parseAlignment(separator: string, columns: number): string[] {
  const cells = splitRow(separator);
  const align: string[] = [];
  for (let i = 0; i < columns; i += 1) {
    const cell = cells[i] || "";
    const left = cell.startsWith(":");
    const right = cell.endsWith(":");
    align.push(left && right ? "center" : right ? "right" : "left");
  }
  return align;
}

function formatTableBlock(lines: string[]): string[] {
  const rows = lines.map(splitRow);
  const columnCount = Math.max(...rows.map((row) => row.length));
  const widths = new Array(columnCount).fill(0);

  rows.forEach((row, rowIndex) => {
    if (rowIndex === 1) return;
    for (let i = 0; i < columnCount; i += 1) {
      const cell = row[i] ?? "";
      widths[i] = Math.max(widths[i], cell.length);
    }
  });

  const align = parseAlignment(lines[1], columnCount);

  const formatted: string[] = [];
  rows.forEach((row, rowIndex) => {
    if (rowIndex === 1) {
      const separator = align.map((mode, idx) => {
        const width = Math.max(3, widths[idx]);
        if (mode === "center") return `:${"-".repeat(width - 2)}:`;
        if (mode === "right") return `${"-".repeat(width - 1)}:`;
        return `${"-".repeat(width)}`;
      });
      formatted.push(`| ${separator.join(" | ")} |`);
      return;
    }

    const padded = [];
    for (let i = 0; i < columnCount; i += 1) {
      const cell = row[i] ?? "";
      padded.push(cell.padEnd(widths[i]));
    }
    formatted.push(`| ${padded.join(" | ")} |`);
  });

  return formatted;
}
