import { Suspense } from "react";
import { tools } from "@/lib/tools/registry";
import { ToolPageClient } from "./tool-page-client";

// Only allow pre-rendered paths
export const dynamicParams = false;

// Pre-render all tool pages at build time
export function generateStaticParams() {
  return tools.map((tool) => ({
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

  // Pass only the slug (string) to the client component
  // The client component will look up the tool (which contains functions)
  // Wrap in Suspense because ToolPageClient uses useSearchParams
  return (
    <Suspense fallback={<ToolPageLoading />}>
      <ToolPageClient slug={slug} />
    </Suspense>
  );
}
