"use client";

import { notFound, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { ToolPage } from "@/components/tools/tool-page";
import { getToolBySlug } from "@/lib/tools/registry";

export function ToolPageClient({ slug }: { slug: string }) {
  const tool = getToolBySlug(slug);
  const searchParams = useSearchParams();

  // Parse initial values from URL params (for Raycast "Open in orle.dev" action)
  const initialInput = useMemo(() => {
    const inputParam = searchParams.get("input");
    if (!inputParam) return undefined;

    try {
      // Input is base64 encoded
      return atob(inputParam);
    } catch {
      // Fall back to raw value if not valid base64
      return inputParam;
    }
  }, [searchParams]);

  const initialOptions = useMemo(() => {
    const optionsParam = searchParams.get("options");
    if (!optionsParam) return undefined;

    try {
      return JSON.parse(optionsParam);
    } catch {
      return undefined;
    }
  }, [searchParams]);

  if (!tool) {
    notFound();
  }

  return (
    <ToolPage
      tool={tool}
      initialInput={initialInput}
      initialOptions={initialOptions}
    />
  );
}
