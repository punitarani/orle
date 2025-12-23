"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

export function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopied(false), timeout);
        return true;
      } catch (error) {
        console.error("Failed to copy:", error);
        toast.error("Failed to copy to clipboard");
        return false;
      }
    },
    [timeout],
  );

  return { copied, copy };
}
