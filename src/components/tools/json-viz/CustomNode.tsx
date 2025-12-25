"use client";

import React from "react";
import { Node, type NodeProps } from "reaflow";
import { useGraphStore } from "@/lib/tools/json-viz/store";
import type { GraphNodeData } from "@/lib/tools/json-viz/types";
import { ObjectNode } from "./ObjectNode";
import { TextNode } from "./TextNode";

/**
 * CustomNode wrapper that determines which node renderer to use
 * and handles node interactions
 */
export const CustomNode = React.memo((nodeProps: NodeProps<GraphNodeData>) => {
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode);
  const [_hovered, setHovered] = React.useState(false);

  const handleNodeClick = React.useCallback(
    (event: React.MouseEvent<SVGGElement>, data: GraphNodeData) => {
      event.stopPropagation();
      setSelectedNode(data);
    },
    [setSelectedNode],
  );

  const propsAsGraph = nodeProps.properties as unknown as
    | GraphNodeData
    | undefined;
  const nodeData: GraphNodeData = propsAsGraph ?? {
    id: nodeProps.id,
    data: [],
    width: nodeProps.width ?? 0,
    height: nodeProps.height ?? 0,
  };
  const rows = Array.isArray(nodeData.data) ? nodeData.data : [];
  const primaryRow = rows[0];
  const hasKey = primaryRow?.key !== null && primaryRow !== undefined;

  return (
    <Node
      {...nodeProps}
      onClick={handleNodeClick as never}
      animated={false}
      label={null as never}
      rx={14}
      ry={14}
      onEnter={(ev) => {
        setHovered(true);
        ev.currentTarget.style.stroke = "rgb(59, 130, 246)";
        ev.currentTarget.style.strokeWidth = "2";
      }}
      onLeave={(ev) => {
        setHovered(false);
        ev.currentTarget.style.stroke = "rgb(203, 213, 225)";
        ev.currentTarget.style.strokeWidth = "1";
      }}
      style={{
        fill: "rgb(255, 255, 255)",
        stroke: "rgb(203, 213, 225)",
        strokeWidth: 1,
      }}
    >
      {({ x, y }) => {
        const nodeType = primaryRow?.type;

        // Use TextNode for primitives, ObjectNode for objects/arrays
        if (!hasKey || nodeType === "value") {
          return <TextNode node={nodeData} x={x} y={y} />;
        }

        return <ObjectNode node={nodeData} x={x} y={y} />;
      }}
    </Node>
  );
});

CustomNode.displayName = "CustomNode";
