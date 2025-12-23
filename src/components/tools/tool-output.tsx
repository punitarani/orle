"use client";

import { Copy, Download, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useClipboard } from "@/hooks/use-clipboard";
import type { ToolOutputType } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

type ToolOutputProps = {
  type: ToolOutputType;
  value: string;
  error?: string | null;
  isProcessing?: boolean;
  placeholder?: string;
  className?: string;
};

export function ToolOutput({
  type,
  value,
  error,
  isProcessing,
  placeholder = "Output will appear here...",
  className,
}: ToolOutputProps) {
  const { copied, copy } = useClipboard();

  const handleCopy = () => {
    if (value) copy(value);
  };

  const handleDownload = () => {
    if (!value) return;

    // Check if value contains a blob URL
    const urlMatch = value.match(/Download:\s*(blob:[^\s]+)/);
    if (urlMatch) {
      const a = document.createElement("a");
      a.href = urlMatch[1];
      a.download = "output";
      a.click();
      return;
    }

    // Otherwise download as text
    const blob = new Blob([value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "output.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div
        className={cn(
          "rounded-lg border border-destructive/50 bg-destructive/10 p-4",
          className,
        )}
      >
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div
        className={cn(
          "flex min-h-[200px] items-center justify-center rounded-lg border bg-muted/30",
          className,
        )}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">Processing...</span>
        </div>
      </div>
    );
  }

  if (type === "image" && value) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="overflow-hidden rounded-lg border bg-muted/30 p-4">
          <div className="relative h-[400px] w-full">
            <Image
              src={value}
              alt="Output"
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-contain"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="mr-2 size-4" />
            {copied ? "Copied!" : "Copy Data URL"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const a = document.createElement("a");
              a.href = value;
              a.download = "image.png";
              a.click();
            }}
          >
            <Download className="mr-2 size-4" />
            Download
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="relative">
        <Textarea
          value={value}
          readOnly
          placeholder={placeholder}
          className="min-h-[200px] resize-y font-mono text-sm"
        />
        {value && (
          <div className="absolute right-2 top-2 flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={handleCopy}
            >
              <Copy className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={handleDownload}
            >
              <Download className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
