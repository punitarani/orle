"use client";

import { ImageIcon, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const { isDragging, file, clearFile, dropProps, handleFileInput } =
    useFileDrop({
      onDrop: onFileChange,
    });

  // Generate image preview when file changes
  useEffect(() => {
    if (file?.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);

      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };
      img.src = url;

      return () => URL.revokeObjectURL(url);
    }
    setImagePreview(null);
    setImageDimensions(null);
  }, [file]);

  const handleClearFile = () => {
    clearFile();
    setImagePreview(null);
    setImageDimensions(null);
  };

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
            "flex min-h-[200px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-left transition-colors overflow-hidden",
            isDragging
              ? "border-primary bg-primary/5"
              : file
                ? "border-muted-foreground/50"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
          )}
          onClick={handleBrowse}
        >
          {file ? (
            <div className="flex w-full flex-col items-center gap-3">
              {/* Image Preview - using img because src is a blob URL */}
              {imagePreview ? (
                <div className="relative w-full max-w-[300px]">
                  {/* biome-ignore lint/performance/noImgElement: blob URL not supported by next/image */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mx-auto max-h-[180px] w-auto rounded-md object-contain"
                  />
                </div>
              ) : (
                <div className="flex size-16 items-center justify-center rounded-lg bg-muted">
                  <ImageIcon className="size-8 text-muted-foreground" />
                </div>
              )}
              {/* File Info */}
              <div className="text-center">
                <p className="text-sm font-medium truncate max-w-[250px]">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                  {imageDimensions &&
                    ` • ${imageDimensions.width}×${imageDimensions.height}`}
                </p>
              </div>
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
          accept="image/*"
        />
        {file && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-2 top-2 size-7 shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleClearFile();
            }}
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
