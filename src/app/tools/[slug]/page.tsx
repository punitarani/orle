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

export default async function ToolPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Pass only the slug (string) to the client component
  // The client component will look up the tool (which contains functions)
  return <ToolPageClient slug={slug} />;
}
