"use client";

import { GitBranch, ListTree } from "lucide-react";
import dynamic from "next/dynamic";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { JsonVisualizerResultData } from "@/lib/tools/types";
import { NodeDetails } from "./json-viz/NodeDetails";
import { SearchInput } from "./json-viz/SearchInput";
import { TreeView } from "./json-viz/TreeView";

// Dynamically import GraphView with SSR disabled to avoid browser API issues
const GraphView = dynamic(
  () =>
    import("./json-viz/GraphView").then((mod) => ({ default: mod.GraphView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-lg border bg-muted/20">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="text-sm">Loading graph...</span>
        </div>
      </div>
    ),
  },
);

type JsonVisualizerOutputProps = {
  data: JsonVisualizerResultData;
  rawOutput?: string;
};

/**
 * JsonVisualizerOutput - Main orchestrator component
 * Uses modular components for graph/tree visualization
 */
export function JsonVisualizerOutput({
  data,
  rawOutput,
}: JsonVisualizerOutputProps) {
  const [view, setView] = React.useState<"graph" | "tree">(
    data.initialView ?? "graph",
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
      {/* Main visualization area */}
      <div className="space-y-3">
        {/* View controls header */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View toggle */}
          <div className="inline-flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
            <Button
              size="sm"
              variant={view === "graph" ? "default" : "ghost"}
              onClick={() => setView("graph")}
              className="gap-2"
            >
              <GitBranch className="size-4" />
              Graph
            </Button>
            <Button
              size="sm"
              variant={view === "tree" ? "default" : "ghost"}
              onClick={() => setView("tree")}
              className="gap-2"
            >
              <ListTree className="size-4" />
              Tree
            </Button>
          </div>

          {/* Metadata badges */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 text-xs">
              {data.nodeCount} nodes
            </Badge>
            <Badge variant="secondary" className="gap-1.5 text-xs">
              Depth {data.depth}
            </Badge>
          </div>

          {/* Search */}
          <div className="ml-auto">
            <SearchInput />
          </div>
        </div>

        {/* Visualization */}
        <div className="h-[500px]">
          {view === "graph" ? (
            <GraphView data={data} />
          ) : (
            <TreeView data={data} />
          )}
        </div>
      </div>

      {/* Node details sidebar */}
      <NodeDetails rawOutput={rawOutput} />
    </div>
  );
}
