"use client";

import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@/hooks/use-clipboard";
import type { DiffResultData } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

type DiffOutputProps = {
  data: DiffResultData;
  className?: string;
};

export function DiffOutput({ data, className }: DiffOutputProps) {
  const { copied, copy } = useClipboard();

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
      {/* Stats */}
      {data.stats && (
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
      )}

      {/* Diff view */}
      <div className="overflow-auto rounded-lg border bg-muted/20 font-mono text-sm">
        <div className="min-w-max p-4">
          {data.changes.length > 0 ? (
            data.changes.map((change, i) => (
              <div
                key={`${change.type}-${i}-${change.value.slice(0, 20)}`}
                className={cn(
                  "whitespace-pre-wrap px-2 py-0.5 -mx-2 rounded-sm",
                  change.type === "added" &&
                    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                  change.type === "removed" &&
                    "bg-red-500/10 text-red-700 dark:text-red-300 line-through",
                  change.type === "unchanged" && "text-muted-foreground",
                )}
              >
                <span className="inline-block w-4 mr-2 text-xs opacity-50">
                  {change.type === "added" && "+"}
                  {change.type === "removed" && "−"}
                  {change.type === "unchanged" && " "}
                </span>
                {change.value}
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No differences found
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
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
