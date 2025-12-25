"use client";

import React from "react";
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
      className="flex items-center border-b border-muted-foreground/10 px-2.5 py-1 last:border-b-0"
      style={{ height: NODE_DIMENSIONS.ROW_HEIGHT }}
    >
      <span className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400">
        {row.key}:{" "}
      </span>
      <span
        className="ml-1 font-mono text-xs"
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

  return (
    <foreignObject
      width={width}
      height={height}
      x={0}
      y={0}
      data-node-id={node.id}
      className="overflow-hidden"
    >
      <div
        className="h-full w-full overflow-hidden bg-white font-mono text-xs"
        style={{ borderRadius: "14px" }}
      >
        {data.map((row, index) => (
          <Row key={`${node.id}-${index}`} row={row} />
        ))}
      </div>
    </foreignObject>
  );
});

ObjectNode.displayName = "ObjectNode";
