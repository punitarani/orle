"use client";

import React from "react";
import { Edge, type EdgeProps, Label } from "reaflow";
import { useGraphStore } from "@/lib/tools/json-viz/store";

/**
 * CustomEdge component with click-to-focus functionality
 */
export const CustomEdge = React.memo((props: EdgeProps) => {
  const [hovered, setHovered] = React.useState(false);
  const focusNode = useGraphStore((state) => state.focusNode);
  const edges = useGraphStore((state) => state.edges);

  const handleClick = React.useCallback(() => {
    const targetNodeId = edges.find(
      (edge) => edge.id === props.properties?.id,
    )?.to;

    if (targetNodeId) {
      focusNode(targetNodeId);
    }
  }, [edges, focusNode, props.properties?.id]);

  const rawLabel =
    props.properties && "label" in props.properties
      ? (props.properties as { label?: unknown }).label
      : undefined;
  const labelText =
    rawLabel === undefined || rawLabel === null ? "" : String(rawLabel).trim();
  const labelElement =
    labelText.length > 0 ? (
      <Label
        className="fill-muted-foreground text-[10px] font-medium"
        text={labelText}
      />
    ) : undefined;

  return (
    <Edge
      {...props}
      onClick={handleClick}
      onEnter={() => setHovered(true)}
      onLeave={() => setHovered(false)}
      style={{
        stroke: hovered ? "rgb(59, 130, 246)" : "rgb(203, 213, 225)",
        strokeWidth: hovered ? 2 : 1.5,
        transition: "all 0.2s ease",
      }}
      label={labelElement}
    />
  );
});

CustomEdge.displayName = "CustomEdge";
