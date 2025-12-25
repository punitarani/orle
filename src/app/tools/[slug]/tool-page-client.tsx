"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { ToolPage } from "@/components/tools/tool-page";
import { getToolMetaBySlug } from "@/lib/tools/manifest";
import { loadToolRuntime } from "@/lib/tools/runtime";
import type { ToolDefinition } from "@/lib/tools/types";

function useQueryParam(name: string) {
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const sp = new URLSearchParams(window.location.search);
      setValue(sp.get(name));
    };
    update();
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, [name]);

  return value;
}

function ToolPageClientInner({ slug }: { slug: string }) {
  const [tool, setTool] = useState<ToolDefinition | null>(null);
  const toolMeta = getToolMetaBySlug(slug);
  const inputParam = useQueryParam("input");
  const optionsParam = useQueryParam("options");

  useEffect(() => {
    let active = true;
    loadToolRuntime(slug).then((loaded) => {
      if (active) {
        setTool(loaded ?? null);
      }
    });
    return () => {
      active = false;
    };
  }, [slug]);

  // Parse initial values from URL params (for Raycast "Open in orle.dev" action)
  const initialInput = useMemo(() => {
    if (!inputParam) return undefined;

    try {
      return atob(inputParam);
    } catch {
      return inputParam;
    }
  }, [inputParam]);

  const initialOptions = useMemo(() => {
    if (!optionsParam) return undefined;

    try {
      return JSON.parse(optionsParam);
    } catch {
      return undefined;
    }
  }, [optionsParam]);

  const mergedOptions = useMemo(() => {
    if (!toolMeta?.presetOptions) return initialOptions;
    return { ...toolMeta.presetOptions, ...initialOptions };
  }, [toolMeta?.presetOptions, initialOptions]);

  if (!toolMeta) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        Tool not found.
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <ToolPage
      tool={tool}
      initialInput={initialInput}
      initialOptions={mergedOptions}
      showHeader={false}
    />
  );
}

export function ToolPageClient({ slug }: { slug: string }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <ToolPageClientInner slug={slug} />
    </Suspense>
  );
}
