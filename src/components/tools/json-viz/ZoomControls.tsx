"use client";

import { Crosshair, Maximize2, Minus, Plus } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { useGraphStore } from "@/lib/tools/json-viz/store";

/**
 * ZoomControls component for graph navigation
 */
export function ZoomControls() {
  const zoomIn = useGraphStore((state) => state.zoomIn);
  const zoomOut = useGraphStore((state) => state.zoomOut);
  const centerView = useGraphStore((state) => state.centerView);
  const nodes = useGraphStore((state) => state.nodes);
  const focusNode = useGraphStore((state) => state.focusNode);

  const handleFocusFirst = React.useCallback(() => {
    if (nodes.length > 0) {
      focusNode(nodes[0].id);
    }
  }, [nodes, focusNode]);

  return (
    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-lg border bg-background/95 p-1 shadow-lg backdrop-blur-sm">
      <Button
        size="icon"
        variant="ghost"
        className="size-9"
        onClick={handleFocusFirst}
        title="Focus first node (⇧+2)"
      >
        <Crosshair className="size-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-9"
        onClick={centerView}
        title="Fit to center (⇧+1)"
      >
        <Maximize2 className="size-4" />
      </Button>
      <div className="h-5 w-px bg-border" />
      <Button
        size="icon"
        variant="ghost"
        className="size-9"
        onClick={zoomOut}
        title="Zoom out"
      >
        <Minus className="size-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-9"
        onClick={zoomIn}
        title="Zoom in"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
