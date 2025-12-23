"use client";

import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
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
          "flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border bg-muted/30",
          className,
        )}
      >
        <div className="relative">
          <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary" />
        </div>
        <span className="text-sm text-muted-foreground">Processing...</span>
      </div>
    );
  }

  // Empty state
  if (!value) {
    return (
      <div
        className={cn(
          "flex min-h-[200px] items-center justify-center rounded-lg border border-dashed bg-muted/5",
          className,
        )}
      >
        <p className="text-sm text-muted-foreground/60">
          {placeholder || "Output will appear here"}
        </p>
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
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Textarea
        value={value}
        readOnly
        placeholder={placeholder}
        className="min-h-[200px] resize-y font-mono text-sm"
      />
    </div>
  );
}
