import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getToolMetaBySlug, TOOL_META } from "@/lib/tools/manifest";
import { ToolPageClient } from "./tool-page-client";

// Only allow pre-rendered paths
export const dynamicParams = false;

// Pre-render all tool pages at build time
export function generateStaticParams() {
  return TOOL_META.map((tool) => ({
    slug: tool.slug,
  }));
}

function ToolPageLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export default async function ToolPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const toolMeta = getToolMetaBySlug(slug);
  if (!toolMeta) {
    notFound();
  }

  // Pass only the slug (string) to the client component
  // The client component will look up the tool (which contains functions)
  // Wrap in Suspense because ToolPageClient uses useSearchParams
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {toolMeta.name}
        </h1>
        <p className="text-sm text-muted-foreground">{toolMeta.description}</p>
      </div>
      <Suspense fallback={<ToolPageLoading />}>
        <ToolPageClient slug={slug} />
      </Suspense>
    </div>
  );
}
