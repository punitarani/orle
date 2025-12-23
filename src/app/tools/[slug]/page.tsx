"use client";

import { notFound, useParams } from "next/navigation";
import { ToolPage } from "@/components/tools/tool-page";
import { getToolBySlug } from "@/lib/tools/registry";

export default function ToolPageRoute() {
  const params = useParams();
  const slug = params.slug as string;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  return <ToolPage tool={tool} />;
}
