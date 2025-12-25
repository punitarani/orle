"use client";

import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGraphStore } from "@/lib/tools/json-viz/store";

/**
 * SearchInput component with debounced search
 */
export function SearchInput() {
  const [localQuery, setLocalQuery] = React.useState("");
  const setSearchQuery = useGraphStore((state) => state.setSearchQuery);
  const matchedNodes = useGraphStore((state) => state.matchedNodes);
  const currentMatchIndex = useGraphStore((state) => state.currentMatchIndex);
  const nextMatch = useGraphStore((state) => state.nextMatch);
  const previousMatch = useGraphStore((state) => state.previousMatch);

  // Debounced search to avoid excessive re-renders
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 450);

    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
  };

  const handleClear = () => {
    setLocalQuery("");
    setSearchQuery("");
  };

  const matchCount = matchedNodes.size;
  const hasMatches = matchCount > 0;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={localQuery}
          onChange={handleChange}
          placeholder="Search keys, values, paths..."
          className="h-9 w-[240px] pl-8 pr-8"
          title="Search keys, values, paths"
        />
        {localQuery && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-0 top-1/2 size-7 -translate-y-1/2"
            onClick={handleClear}
            title="Clear search"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      {hasMatches && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">
            {currentMatchIndex + 1} / {matchCount}
          </span>
          <div className="flex items-center">
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={previousMatch}
              disabled={matchCount === 0}
              title="Previous match"
            >
              <ChevronUp className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={nextMatch}
              disabled={matchCount === 0}
              title="Next match"
            >
              <ChevronDown className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
