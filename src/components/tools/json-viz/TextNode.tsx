"use client";

import React from "react";
import type { GraphNodeData } from "@/lib/tools/json-viz/types";
import { getRowDisplayValue } from "@/lib/tools/json-viz/utils";
import { cn } from "@/lib/utils";
import { TextRenderer } from "./TextRenderer";

interface TextNodeProps {
  node: GraphNodeData;
  x: number;
  y: number;
}

/**
 * TextNode renders primitive value nodes (strings, numbers, booleans, null)
 */
export const TextNode = React.memo(({ node }: TextNodeProps) => {
  const { data, width, height } = node;
  const value = data[0]?.value;
  const valueType = typeof value;
  const isBoolean = typeof value === "boolean";
  const booleanValue = isBoolean ? (value as boolean) : false;

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
        className={cn(
          "flex h-full w-full items-center justify-center bg-white px-3 py-2",
          "font-mono text-xs font-medium",
        )}
        style={{
          borderRadius: "14px",
          color:
            value === null
              ? "rgb(156, 163, 175)"
              : valueType === "number"
                ? "rgb(34, 197, 94)"
                : valueType === "boolean"
                  ? booleanValue
                    ? "rgb(34, 197, 94)"
                    : "rgb(239, 68, 68)"
                  : "rgb(99, 102, 241)",
        }}
      >
        <TextRenderer>{getRowDisplayValue(data[0])}</TextRenderer>
      </div>
    </foreignObject>
  );
});

TextNode.displayName = "TextNode";
