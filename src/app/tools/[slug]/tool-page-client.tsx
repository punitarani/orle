"use client";

import { notFound } from "next/navigation";
import { ToolPage } from "@/components/tools/tool-page";
import { getToolBySlug } from "@/lib/tools/registry";

export function ToolPageClient({ slug }: { slug: string }) {
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  return <ToolPage tool={tool} />;
}
