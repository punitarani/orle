"use client";

import {
  Copy,
  Download,
  LayoutGrid,
  Rows3,
  SplitSquareVertical,
} from "lucide-react";
import { useMemo } from "react";
import type { RowComponentProps } from "react-window";
import { List } from "react-window";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@/hooks/use-clipboard";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { DiffResultData } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

type DiffView = "inline" | "side-by-side" | "unified";

type DiffOutputProps = {
  data: DiffResultData;
  inputA?: string;
  inputB?: string;
  diffMode?: "lines" | "words" | "chars";
  className?: string;
};

type InlineRow = {
  type: "added" | "removed" | "unchanged";
  text: string;
  lineNumber?: number;
};

type SideRow = {
  left: string;
  right: string;
  leftLine?: number;
  rightLine?: number;
  leftType?: "added" | "removed" | "unchanged";
  rightType?: "added" | "removed" | "unchanged";
};

const LINE_HEIGHT = 22;

export function DiffOutput({
  data,
  inputA,
  inputB,
  diffMode = "lines",
  className,
}: DiffOutputProps) {
  const { copied, copy } = useClipboard();
  const [view, setView] = useLocalStorage<DiffView>("orle-diff-view", "inline");

  const supportsSideBySide = diffMode === "lines";
  const effectiveView = supportsSideBySide ? view : "inline";

  const inlineRows = useMemo(() => buildInlineRows(data), [data]);

  const sideRows = useMemo(() => {
    if (!supportsSideBySide) return [];
    return buildSideBySideRows(data);
  }, [data, supportsSideBySide]);

  const unifiedLines = useMemo(
    () => splitLines(data.textOutput),
    [data.textOutput],
  );

  const handleDownload = () => {
    const blob = new Blob([data.textOutput], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diff.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {data.stats ? (
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">
                +{data.stats.additions}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full bg-red-500" />
              <span className="text-red-600 dark:text-red-400">
                −{data.stats.deletions}
              </span>
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Diff summary</span>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {!supportsSideBySide && (
            <span className="text-xs text-muted-foreground">
              Side-by-side is available for line diffs only.
            </span>
          )}
          <div className="flex items-center gap-1 rounded-full border bg-background p-1">
            <Button
              variant={effectiveView === "inline" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 rounded-full px-3"
              onClick={() => setView("inline")}
            >
              <Rows3 className="mr-1 size-3.5" />
              Inline
            </Button>
            <Button
              variant={effectiveView === "side-by-side" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 rounded-full px-3"
              onClick={() => setView("side-by-side")}
              disabled={!supportsSideBySide}
            >
              <SplitSquareVertical className="mr-1 size-3.5" />
              Side
            </Button>
            <Button
              variant={effectiveView === "unified" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 rounded-full px-3"
              onClick={() => setView("unified")}
            >
              <LayoutGrid className="mr-1 size-3.5" />
              Unified
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/20 font-mono text-sm">
        <div className="h-[420px] w-full">
          {isEmptyView(effectiveView, inlineRows, sideRows, unifiedLines) ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No differences found
            </div>
          ) : effectiveView === "side-by-side" ? (
            <List<{ rows: SideRow[] }>
              rowCount={sideRows.length}
              rowHeight={LINE_HEIGHT}
              rowComponent={SideBySideRow}
              rowProps={{ rows: sideRows }}
              style={{ height: "100%", width: "100%" }}
              defaultHeight={420}
              defaultWidth={800}
            />
          ) : effectiveView === "unified" ? (
            <List<{ rows: string[] }>
              rowCount={unifiedLines.length}
              rowHeight={LINE_HEIGHT}
              rowComponent={UnifiedRow}
              rowProps={{ rows: unifiedLines }}
              style={{ height: "100%", width: "100%" }}
              defaultHeight={420}
              defaultWidth={800}
            />
          ) : (
            <List<{ rows: InlineRow[] }>
              rowCount={inlineRows.length}
              rowHeight={LINE_HEIGHT}
              rowComponent={InlineRow}
              rowProps={{ rows: inlineRows }}
              style={{ height: "100%", width: "100%" }}
              defaultHeight={420}
              defaultWidth={800}
            />
          )}
        </div>

        {effectiveView === "side-by-side" &&
          inputA !== undefined &&
          inputB !== undefined && (
            <div className="flex items-center justify-between border-t bg-background px-3 py-2 text-xs text-muted-foreground">
              <span>Left: {inputA.length.toLocaleString()} chars</span>
              <span>Right: {inputB.length.toLocaleString()} chars</span>
            </div>
          )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => copy(data.textOutput)}
        >
          <Copy className="mr-2 size-4" />
          {copied ? "Copied!" : "Copy"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="mr-2 size-4" />
          Download
        </Button>
      </div>
    </div>
  );
}

function buildInlineRows(data: DiffResultData): InlineRow[] {
  const rows: InlineRow[] = [];
  let lineNumber = 1;
  for (const change of data.changes) {
    const lines = splitLines(change.value);
    for (const line of lines) {
      rows.push({
        type: change.type,
        text: line,
        lineNumber: change.type === "added" ? undefined : lineNumber,
      });
      if (change.type !== "added") lineNumber += 1;
    }
  }
  return rows;
}

function buildSideBySideRows(data: DiffResultData): SideRow[] {
  const rows: SideRow[] = [];
  let leftLine = 1;
  let rightLine = 1;

  for (const change of data.changes) {
    const lines = splitLines(change.value);
    for (const line of lines) {
      if (change.type === "unchanged") {
        rows.push({
          left: line,
          right: line,
          leftLine,
          rightLine,
          leftType: "unchanged",
          rightType: "unchanged",
        });
        leftLine += 1;
        rightLine += 1;
      } else if (change.type === "removed") {
        rows.push({
          left: line,
          right: "",
          leftLine,
          leftType: "removed",
        });
        leftLine += 1;
      } else if (change.type === "added") {
        rows.push({
          left: "",
          right: line,
          rightLine,
          rightType: "added",
        });
        rightLine += 1;
      }
    }
  }

  return rows;
}

function splitLines(value: string): string[] {
  if (!value) return [""];
  const lines = value.split("\n");
  if (lines.length > 1 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines;
}

function isEmptyView(
  view: DiffView,
  inlineRows: InlineRow[],
  sideRows: SideRow[],
  unifiedLines: string[],
): boolean {
  if (view === "side-by-side") return sideRows.length === 0;
  if (view === "unified") return unifiedLines.length === 0;
  return inlineRows.length === 0;
}

function InlineRow({
  index,
  style,
  rows,
  ariaAttributes,
}: RowComponentProps<{ rows: InlineRow[] }>) {
  const row = rows[index];
  return (
    <div
      style={{ ...style, minWidth: "max-content" }}
      {...ariaAttributes}
      className={cn(
        "flex items-center gap-2 px-3 text-xs whitespace-pre",
        row.type === "added" &&
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        row.type === "removed" &&
          "bg-red-500/10 text-red-700 dark:text-red-300",
        row.type === "unchanged" && "text-muted-foreground",
      )}
    >
      <span className="w-10 text-right text-[10px] text-muted-foreground/70">
        {row.lineNumber ?? ""}
      </span>
      <span className="w-3 text-[10px] text-muted-foreground/70">
        {row.type === "added" ? "+" : row.type === "removed" ? "−" : " "}
      </span>
      <span>{row.text}</span>
    </div>
  );
}

function SideBySideRow({
  index,
  style,
  rows,
  ariaAttributes,
}: RowComponentProps<{ rows: SideRow[] }>) {
  const row = rows[index];
  return (
    <div
      style={{ ...style, minWidth: "max-content" }}
      {...ariaAttributes}
      className="grid grid-cols-2 border-b border-border/40"
    >
      <div
        className={cn(
          "flex items-center gap-2 px-3 text-xs whitespace-pre",
          row.leftType === "removed" &&
            "bg-red-500/10 text-red-700 dark:text-red-300",
          row.leftType === "unchanged" && "text-muted-foreground",
        )}
      >
        <span className="w-10 text-right text-[10px] text-muted-foreground/70">
          {row.leftLine ?? ""}
        </span>
        <span>{row.left}</span>
      </div>
      <div
        className={cn(
          "flex items-center gap-2 border-l border-border/40 px-3 text-xs whitespace-pre",
          row.rightType === "added" &&
            "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
          row.rightType === "unchanged" && "text-muted-foreground",
        )}
      >
        <span className="w-10 text-right text-[10px] text-muted-foreground/70">
          {row.rightLine ?? ""}
        </span>
        <span>{row.right}</span>
      </div>
    </div>
  );
}

function UnifiedRow({
  index,
  style,
  rows,
  ariaAttributes,
}: RowComponentProps<{ rows: string[] }>) {
  const line = rows[index] ?? "";
  const type = line.startsWith("+")
    ? "added"
    : line.startsWith("-")
      ? "removed"
      : "unchanged";
  return (
    <div
      style={{ ...style, minWidth: "max-content" }}
      {...ariaAttributes}
      className={cn(
        "flex items-center gap-2 px-3 text-xs whitespace-pre",
        type === "added" &&
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        type === "removed" && "bg-red-500/10 text-red-700 dark:text-red-300",
        type === "unchanged" && "text-muted-foreground",
      )}
    >
      <span className="w-10 text-right text-[10px] text-muted-foreground/70">
        {index + 1}
      </span>
      <span>{line}</span>
    </div>
  );
}
