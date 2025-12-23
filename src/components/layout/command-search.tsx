"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { getToolsBySection, SECTIONS, searchTools } from "@/lib/tools/registry";

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback(
    (slug: string) => {
      setOpen(false);
      setQuery("");
      router.push(`/tools/${slug}`);
    },
    [router],
  );

  const filteredTools = query ? searchTools(query) : [];
  const showSections = !query;

  return (
    <>
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
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search tools by name, alias, or description..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
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
                      onSelect={() => handleSelect(tool.slug)}
                    >
                      <span>{tool.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {tool.description}
                      </span>
                    </CommandItem>
                  ))}
                  {tools.length > 5 && (
                    <CommandItem
                      value={`more-${section.id}`}
                      className="text-muted-foreground"
                      onSelect={() => {
                        setQuery(section.name);
                      }}
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
                  onSelect={() => handleSelect(tool.slug)}
                >
                  <span>{tool.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {tool.description}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
