"use client";

import { useCallback, useEffect } from "react";

type Shortcut = {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: () => void;
};

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        // Allow Cmd+Enter even in inputs
        if (!(event.key === "Enter" && (event.metaKey || event.ctrlKey))) {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const keyMatches =
          event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
        const metaMatches = !!shortcut.metaKey === event.metaKey;
        const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
        const altMatches = !!shortcut.altKey === event.altKey;

        // Check for Cmd/Ctrl key (cross-platform)
        const cmdCtrlMatches =
          (shortcut.metaKey || shortcut.ctrlKey) &&
          (event.metaKey || event.ctrlKey);

        if (
          keyMatches &&
          (cmdCtrlMatches || (ctrlMatches && metaMatches)) &&
          shiftMatches &&
          altMatches
        ) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
