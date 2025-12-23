"use client";

import { type DragEvent, useCallback, useState } from "react";

type UseFileDropOptions = {
  accept?: string[];
  maxSize?: number;
  onDrop?: (file: File) => void;
  onError?: (error: string) => void;
};

export function useFileDrop(options: UseFileDropOptions = {}) {
  const { accept, maxSize = 50 * 1024 * 1024, onDrop, onError } = options;
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer?.files?.[0];
      if (!droppedFile) return;

      // Check file type
      if (accept && accept.length > 0) {
        const isAccepted = accept.some((type) => {
          if (type.startsWith(".")) {
            return droppedFile.name.toLowerCase().endsWith(type.toLowerCase());
          }
          if (type.endsWith("/*")) {
            return droppedFile.type.startsWith(type.slice(0, -1));
          }
          return droppedFile.type === type;
        });

        if (!isAccepted) {
          onError?.(`File type not accepted. Expected: ${accept.join(", ")}`);
          return;
        }
      }

      // Check file size
      if (droppedFile.size > maxSize) {
        onError?.(`File too large. Maximum size: ${formatBytes(maxSize)}`);
        return;
      }

      setFile(droppedFile);
      onDrop?.(droppedFile);
    },
    [accept, maxSize, onDrop, onError],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      if (selectedFile.size > maxSize) {
        onError?.(`File too large. Maximum size: ${formatBytes(maxSize)}`);
        return;
      }

      setFile(selectedFile);
      onDrop?.(selectedFile);
    },
    [maxSize, onDrop, onError],
  );

  const clearFile = useCallback(() => {
    setFile(null);
  }, []);

  return {
    isDragging,
    file,
    clearFile,
    dropProps: {
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
    handleFileInput,
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
