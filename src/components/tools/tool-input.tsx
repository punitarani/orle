"use client";

import { Upload, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFileDrop } from "@/hooks/use-file-drop";
import type { ToolInputType } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

type ToolInputProps = {
  type: ToolInputType;
  value: string;
  onChange: (value: string) => void;
  onFileChange?: (file: File) => void;
  placeholder?: string;
  className?: string;
};

export function ToolInput({
  type,
  value,
  onChange,
  onFileChange,
  placeholder = "Enter input...",
  className,
}: ToolInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleBrowse = () => fileInputRef.current?.click();

  const { isDragging, file, clearFile, dropProps, handleFileInput } =
    useFileDrop({
      onDrop: onFileChange,
    });

  if (type === "none") {
    return null;
  }

  if (type === "file") {
    return (
      <div className={cn("relative", className)}>
        <button
          type="button"
          {...dropProps}
          className={cn(
            "flex min-h-[200px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-left transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
          )}
          onClick={handleBrowse}
        >
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <div className="text-sm font-medium">{file.name}</div>
              <span className="text-xs text-muted-foreground">
                {formatBytes(file.size)}
              </span>
            </div>
          ) : (
            <>
              <Upload className="mb-2 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drop a file here or click to browse
              </p>
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInput}
        />
        {file && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 size-6"
            onClick={clearFile}
            aria-label="Remove file"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    );
  }

  if (type === "dual") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[120px] resize-y font-mono text-sm"
        />
        <div className="relative">
          <button
            type="button"
            {...dropProps}
            className={cn(
              "flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-left transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
            )}
            onClick={handleBrowse}
          >
            <Upload className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {file
                ? `${file.name} (${formatBytes(file.size)})`
                : "Or drop a file"}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileInput}
          />
          {file && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 size-6"
              onClick={clearFile}
              aria-label="Remove file"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn("min-h-[200px] resize-y font-mono text-sm", className)}
    />
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
