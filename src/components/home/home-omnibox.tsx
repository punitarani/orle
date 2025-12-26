"use client";

import { ArrowUpRight, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { getToolMetaBySlug } from "@/lib/tools/manifest";
import type { ToolMeta } from "@/lib/tools/manifest-types";
import { searchTools } from "@/lib/tools/search";
import { SECTION_META } from "@/lib/tools/section-meta";

const POPULAR_SLUGS = [
  "json-format",
  "base64-text",
  "uuid-generator",
  "hash-text",
  "url-encode",
  "epoch-converter",
];

const EXAMPLE_QUERIES = [
  "Format JSON",
  "Generate cURL",
  "Encode URL",
  "JWT decoder",
];

function usePopularTools(): ToolMeta[] {
  return useMemo(
    () =>
      POPULAR_SLUGS.map((slug) => getToolMetaBySlug(slug)).filter(
        (tool): tool is ToolMeta => Boolean(tool),
      ),
    [],
  );
}

export function HomeOmnibox() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState("");
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popularTools = usePopularTools();

  const createValue = "__create__";
  const normalizedQuery = useMemo(() => query.trim(), [query]);

  const filteredTools = useMemo(() => {
    if (!normalizedQuery) return popularTools;
    return searchTools(normalizedQuery).slice(0, 8);
  }, [normalizedQuery, popularTools]);

  const listValues = useMemo(() => {
    const values = [createValue];
    filteredTools.forEach((tool) => {
      values.push(tool.slug);
    });
    if (!normalizedQuery) {
      SECTION_META.slice(0, 6).forEach((section) => {
        values.push(`section-${section.id}`);
      });
    }
    return values;
  }, [filteredTools, normalizedQuery]);

  const handleCreate = useCallback(
    (prompt?: string) => {
      const nextPrompt = prompt?.trim();
      const href = nextPrompt
        ? `/tools/generate?prompt=${encodeURIComponent(nextPrompt)}`
        : "/tools/generate";
      router.push(href);
    },
    [router],
  );

  const handleSelectTool = useCallback(
    (slug: string) => {
      router.push(`/tools/${slug}`);
    },
    [router],
  );

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (filteredTools.length > 0) {
      setSelectedValue(filteredTools[0].slug);
      return;
    }
    setSelectedValue(createValue);
  }, [open, filteredTools]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (listValues.length === 0) return;

      const currentIndex = Math.max(
        0,
        listValues.indexOf(selectedValue) === -1
          ? 0
          : listValues.indexOf(selectedValue),
      );
      const nextIndex =
        event.key === "ArrowDown"
          ? Math.min(currentIndex + 1, listValues.length - 1)
          : Math.max(currentIndex - 1, 0);
      setSelectedValue(listValues[nextIndex]);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (selectedValue === createValue) {
        handleCreate(normalizedQuery);
        return;
      }

      if (selectedValue.startsWith("section-")) {
        router.push(`#${selectedValue}`);
        return;
      }

      if (selectedValue) {
        handleSelectTool(selectedValue);
        return;
      }

      handleCreate(normalizedQuery);
    }
  };

  return (
    <div ref={containerRef} className="mx-auto w-full max-w-2xl">
      <div className="relative">
        <div className="flex items-center gap-2 rounded-2xl border bg-background/90 px-3 py-2 text-left shadow-lg shadow-black/5 backdrop-blur sm:gap-3 sm:px-4 sm:py-3">
          <Search className="size-4 text-muted-foreground sm:size-5" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search tools or type to create..."
            className="h-6 border-0 bg-transparent px-0 py-0 text-base text-white placeholder:text-white/60 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-7 sm:text-sm dark:bg-transparent"
            aria-label="Search tools or create a custom tool"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => handleCreate(normalizedQuery)}
            className="hidden rounded-full px-3 text-xs sm:flex"
          >
            Create
            <ArrowUpRight className="size-3" />
          </Button>
        </div>

        {open && (
          <div className="absolute left-0 right-0 top-full z-30 mt-2">
            <Command
              shouldFilter={false}
              value={selectedValue}
              onValueChange={setSelectedValue}
              className="overflow-hidden rounded-2xl border bg-popover shadow-2xl"
            >
              <CommandList className="max-h-[360px]">
                <CommandGroup heading="Create">
                  <CommandItem
                    value={createValue}
                    onSelect={() => handleCreate(normalizedQuery)}
                  >
                    <Sparkles className="size-4 text-primary" />
                    <div className="flex flex-col gap-0.5">
                      <span>Create a custom tool</span>
                      <span className="text-xs text-muted-foreground">
                        Describe what it should do
                      </span>
                    </div>
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />

                {filteredTools.length === 0 ? (
                  <CommandEmpty>
                    No tools found. Create one instead.
                  </CommandEmpty>
                ) : (
                  <CommandGroup
                    heading={normalizedQuery ? "Results" : "Popular tools"}
                  >
                    {filteredTools.map((tool) => (
                      <CommandItem
                        key={tool.slug}
                        value={tool.slug}
                        onSelect={() => handleSelectTool(tool.slug)}
                        className="flex-col items-start gap-0.5"
                      >
                        <span>{tool.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {tool.description}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {!normalizedQuery && (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="Browse categories">
                      {SECTION_META.slice(0, 6).map((section) => (
                        <CommandItem
                          key={section.id}
                          value={`section-${section.id}`}
                          onSelect={() => router.push(`#section-${section.id}`)}
                        >
                          <span>{section.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-1 text-xs text-muted-foreground sm:mt-4 sm:gap-2">
        <span className="text-center uppercase tracking-[0.2em] text-[9px] text-muted-foreground/70 sm:text-[10px]">
          Try
        </span>
        {EXAMPLE_QUERIES.map((example) => (
          <Button
            key={example}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery(example);
              setOpen(true);
              inputRef.current?.focus();
            }}
            className="h-6 rounded-full border-muted/70 px-1.5 text-[9px] leading-none text-foreground/80 hover:text-foreground sm:h-7 sm:px-2 sm:text-xs"
          >
            {example}
          </Button>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Local-first. No data leaves your device.
      </p>
    </div>
  );
}
