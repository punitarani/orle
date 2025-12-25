"use client";

import React from "react";
import { useGraphStore } from "@/lib/tools/json-viz/store";
import type { GraphNodeData, NodeRow } from "@/lib/tools/json-viz/types";
import { NODE_DIMENSIONS } from "@/lib/tools/json-viz/types";
import { getRowDisplayValue } from "@/lib/tools/json-viz/utils";
import { TextRenderer } from "./TextRenderer";

interface ObjectNodeProps {
  node: GraphNodeData;
  x: number;
  y: number;
}

interface RowProps {
  row: NodeRow;
}

/**
 * Single row in an object node
 */
const Row = React.memo(({ row }: RowProps) => {
  const displayValue = getRowDisplayValue(row);

  return (
    <div
      className="flex items-center gap-1 border-b border-muted-foreground/10 px-3 py-1.5 last:border-b-0"
      style={{ height: NODE_DIMENSIONS.ROW_HEIGHT }}
    >
      <span className="font-mono text-[11px] font-semibold text-sky-700 dark:text-sky-300 whitespace-nowrap">
        {row.key}:
      </span>
      <span
        className="ml-1 font-mono text-[11px] whitespace-nowrap"
        style={{
          color:
            row.type === "object"
              ? "rgb(14, 165, 233)"
              : row.type === "array"
                ? "rgb(245, 158, 11)"
                : "rgb(156, 163, 175)",
        }}
      >
        <TextRenderer>{displayValue}</TextRenderer>
      </span>
    </div>
  );
});

Row.displayName = "ObjectRow";

/**
 * ObjectNode renders object and array nodes with multiple rows
 */
export const ObjectNode = React.memo(({ node }: ObjectNodeProps) => {
  const { data, width, height } = node;
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode);

  return (
    <foreignObject
      width={width}
      height={height}
      x={0}
      y={0}
      data-node-id={node.id}
      className="overflow-hidden"
    >
      <button
        type="button"
        className="h-full w-full overflow-hidden bg-white font-mono text-xs shadow-sm text-left"
        style={{ borderRadius: "14px" }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedNode(node);
        }}
      >
        {data.map((row, index) => (
          <Row key={`${node.id}-${index}`} row={row} />
        ))}
      </button>
    </foreignObject>
  );
});

ObjectNode.displayName = "ObjectNode";
