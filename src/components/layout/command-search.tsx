"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { getToolsBySection, SECTIONS, searchTools } from "@/lib/tools/registry";

function SearchResults({
  query,
  onSelect,
  onMoreClick,
}: {
  query: string;
  onSelect: (slug: string) => void;
  onMoreClick: (sectionName: string) => void;
}) {
  const filteredTools = query ? searchTools(query) : [];
  const showSections = !query;

  return (
    <CommandList className="max-h-[60vh]">
      <CommandEmpty>No tools found.</CommandEmpty>
      {showSections ? (
        SECTIONS.map((section) => {
          const tools = getToolsBySection(section.id);
          if (tools.length === 0) return null;
          return (
            <CommandGroup key={section.id} heading={section.name}>
              {tools.slice(0, 5).map((tool) => (
                <CommandItem
                  key={tool.slug}
                  value={tool.slug}
                  onSelect={() => onSelect(tool.slug)}
                >
                  <span>{tool.name}</span>
                  <span className="ml-2 truncate text-xs text-muted-foreground">
                    {tool.description}
                  </span>
                </CommandItem>
              ))}
              {tools.length > 5 && (
                <CommandItem
                  value={`more-${section.id}`}
                  className="text-muted-foreground"
                  onSelect={() => onMoreClick(section.name)}
                >
                  +{tools.length - 5} more...
                </CommandItem>
              )}
            </CommandGroup>
          );
        })
      ) : (
        <CommandGroup heading="Results">
          {filteredTools.map((tool) => (
            <CommandItem
              key={tool.slug}
              value={tool.slug}
              onSelect={() => onSelect(tool.slug)}
            >
              <span>{tool.name}</span>
              <span className="ml-2 truncate text-xs text-muted-foreground">
                {tool.description}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      )}
    </CommandList>
  );
}

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle cmd+k keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      // Close on escape
      if (e.key === "Escape" && open) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSelect = useCallback(
    (slug: string) => {
      setOpen(false);
      setQuery("");
      router.push(`/tools/${slug}`);
    },
    [router],
  );

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  if (!open) {
    return (
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-md bg-muted/50 px-3 text-sm text-muted-foreground sm:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 size-4" />
        <span className="hidden sm:inline-flex">Search tools...</span>
        <span className="inline-flex sm:hidden">Search...</span>
        <Kbd className="pointer-events-none absolute right-2 hidden sm:inline-flex">
          ⌘K
        </Kbd>
      </Button>
    );
  }

  return (
    <>
      {/* Search input in header */}
      <div className="flex h-9 w-full items-center gap-2 rounded-md border bg-background px-3 sm:w-64">
        <Search className="size-4 shrink-0 opacity-50" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          className="flex size-6 shrink-0 items-center justify-center rounded-sm opacity-70 hover:opacity-100"
          onClick={handleClose}
        >
          <X className="size-4" />
          <span className="sr-only">Close search</span>
        </button>
      </div>

      {/* Fixed overlay for results */}
      <button
        type="button"
        aria-label="Close search"
        className="fixed inset-0 top-14 z-50 bg-black/40"
        onClick={handleClose}
      />

      {/* Results dropdown */}
      <div className="fixed inset-x-0 top-14 z-50 mx-4 mt-2 sm:absolute sm:inset-x-auto sm:left-0 sm:right-auto sm:mx-0 sm:w-96">
        <Command className="rounded-lg border bg-popover shadow-lg">
          <SearchResults
            query={query}
            onSelect={handleSelect}
            onMoreClick={setQuery}
          />
        </Command>
      </div>
    </>
  );
}
