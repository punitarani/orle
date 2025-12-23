"use client";

import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@/hooks/use-clipboard";
import type { ImageResultData } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

type ImageToolOutputProps = {
  data: ImageResultData;
  className?: string;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

export function ImageToolOutput({ data, className }: ImageToolOutputProps) {
  const { copied, copy } = useClipboard();

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = data.resultUrl;
    a.download = data.filename || "output";
    a.click();
  };

  // Empty state
  if (!data.resultUrl) {
    return (
      <div
        className={cn(
          "flex min-h-[200px] items-center justify-center rounded-lg border border-dashed bg-muted/5",
          className,
        )}
      >
        <p className="text-sm text-muted-foreground/60">
          Upload an image to see the result
        </p>
      </div>
    );
  }

  const savings = data.savings ?? 0;
  const hasSavings =
    data.originalSize !== undefined && data.savings !== undefined;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Result image - using img because src is a blob URL */}
      <div className="flex items-center justify-center rounded-lg border bg-muted/20 p-4">
        {/* biome-ignore lint/performance/noImgElement: blob URL not supported by next/image */}
        <img
          src={data.resultUrl}
          alt="Result"
          className="max-h-[280px] w-auto rounded object-contain"
        />
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/10 px-4 py-3">
        <div className="flex items-center gap-4 text-sm">
          {/* Dimensions */}
          {data.resultDimensions && (
            <span className="text-muted-foreground">
              {data.resultDimensions.width} × {data.resultDimensions.height}
            </span>
          )}

          {/* Size */}
          <span className="font-medium">{formatBytes(data.resultSize)}</span>

          {/* Savings badge */}
          {hasSavings && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                savings > 0
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
              )}
            >
              {savings > 0 ? "−" : "+"}
              {Math.abs(savings).toFixed(0)}%
              {savings > 0 ? " smaller" : " larger"}
            </span>
          )}
        </div>

        {/* Original size reference */}
        {data.originalSize && (
          <span className="text-xs text-muted-foreground">
            was {formatBytes(data.originalSize)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="mr-2 size-4" />
          Download
        </Button>
        <Button variant="ghost" size="sm" onClick={() => copy(data.resultUrl)}>
          <Copy className="mr-2 size-4" />
          {copied ? "Copied!" : "Copy URL"}
        </Button>
      </div>
    </div>
  );
}
