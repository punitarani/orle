"use client";

import React from "react";
import { Space } from "react-zoomable-ui";
import { Canvas, type CanvasDirection } from "reaflow";
import { parseJsonToGraph } from "@/lib/tools/json-viz/parser";
import { useGraphStore } from "@/lib/tools/json-viz/store";
import type { JsonVisualizerResultData } from "@/lib/tools/types";
import { CustomEdge } from "./CustomEdge";
import { CustomNode } from "./CustomNode";
import { ZoomControls } from "./ZoomControls";

interface GraphViewProps {
  data: JsonVisualizerResultData;
}

/**
 * GraphCanvas renders the reaflow canvas with automatic ELK layout
 */
const GraphCanvas = React.memo(() => {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const direction = useGraphStore((state) => state.direction);
  const simpleLayout = useGraphStore((state) => state.simpleLayout);
  const setLoading = useGraphStore((state) => state.setLoading);
  const centerView = useGraphStore((state) => state.centerView);

  const [paneWidth, setPaneWidth] = React.useState(2000);
  const [paneHeight, setPaneHeight] = React.useState(2000);

  const onLayoutChange = React.useCallback(
    (layout: { width?: number; height?: number }) => {
      if (layout.width && layout.height) {
        const areaSize = layout.width * layout.height;
        const changeRatio = Math.abs(
          (areaSize * 100) / (paneWidth * paneHeight) - 100,
        );

        setPaneWidth(layout.width + 100);
        setPaneHeight(layout.height + 100);

        setTimeout(() => {
          window.requestAnimationFrame(() => {
            if (changeRatio > 70) {
              centerView();
            }
            setLoading(false);
          });
        }, 100);
      }
    },
    [paneHeight, paneWidth, centerView, setLoading],
  );

  // Provide a simple manual layout when ELK is disabled
  const nodesForCanvas = React.useMemo(() => {
    if (!simpleLayout) return nodes;

    const spacingX = 220;
    const spacingY = 140;
    return nodes.map((node, index) => ({
      ...node,
      x: (index % 8) * spacingX,
      y: Math.floor(index / 8) * spacingY,
    }));
  }, [nodes, simpleLayout]);

  const layoutOptions = React.useMemo(() => {
    if (simpleLayout) return undefined;
    return {
      "elk.direction": direction,
    };
  }, [direction, simpleLayout]);

  // Debug logging
  React.useEffect(() => {
    console.log("Graph Canvas Data:", {
      nodeCount: nodesForCanvas.length,
      edgeCount: edges.length,
      paneWidth,
      paneHeight,
      firstNode: nodesForCanvas[0],
      firstEdge: edges[0],
      allNodes: nodesForCanvas,
      allEdges: edges,
    });
  }, [nodesForCanvas, edges, paneWidth, paneHeight]);

  return (
    <Canvas
      key={`canvas-${direction}-${nodesForCanvas.length}-${simpleLayout ? "simple" : "elk"}`}
      className="json-viz-canvas"
      nodes={nodesForCanvas}
      edges={edges}
      width={paneWidth}
      height={paneHeight}
      maxWidth={paneWidth}
      maxHeight={paneHeight}
      direction={direction as CanvasDirection}
      layoutOptions={layoutOptions}
      node={(props) => <CustomNode {...props} />}
      edge={(props) => <CustomEdge {...props} />}
      onLayoutChange={onLayoutChange}
      arrow={null}
      pannable={false}
      zoomable={false}
      animated={false}
      readonly
      fit
      dragNode={null}
      dragEdge={null}
    />
  );
});

GraphCanvas.displayName = "GraphCanvas";

/**
 * GraphView component with pan/zoom controls
 */
export function GraphView({ data }: GraphViewProps) {
  const setViewPort = useGraphStore((state) => state.setViewPort);
  const setGraph = useGraphStore((state) => state.setGraph);
  const viewPort = useGraphStore((state) => state.viewPort);
  const direction = useGraphStore((state) => state.direction);
  const setDirection = useGraphStore((state) => state.setDirection);
  const simpleLayout = useGraphStore((state) => state.simpleLayout);
  const toggleLayoutMode = useGraphStore((state) => state.toggleLayoutMode);

  // Parse JSON data into graph structure on mount
  React.useEffect(() => {
    const graph = parseJsonToGraph(data);
    console.log(
      "Parsed graph:",
      JSON.stringify(
        {
          nodeCount: graph.nodes.length,
          edgeCount: graph.edges.length,
          nodes: graph.nodes,
          edges: graph.edges,
        },
        null,
        2,
      ),
    );
    setGraph(graph.nodes, graph.edges);
  }, [data, setGraph]);

  // Debounced viewport update
  const debouncedOnZoomChange = React.useMemo(() => {
    let timeout: NodeJS.Timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (viewPort) {
          setViewPort(viewPort);
        }
      }, 300);
    };
  }, [viewPort, setViewPort]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-800/70 bg-[#0f0f11] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-auto absolute right-3 top-3 z-10 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border bg-background px-3 py-1 text-xs font-medium shadow-sm transition hover:border-primary hover:text-primary"
          onClick={() => setDirection(direction === "RIGHT" ? "DOWN" : "RIGHT")}
          title="Toggle layout direction"
        >
          Direction: {direction === "RIGHT" ? "→" : "↓"}
        </button>
        <button
          type="button"
          className="rounded-md border bg-background px-3 py-1 text-xs font-medium shadow-sm transition hover:border-primary hover:text-primary"
          onClick={toggleLayoutMode}
          title="Fallback to simple layout if ELK misbehaves"
        >
          Layout: {simpleLayout ? "Simple" : "Auto"}
        </button>
      </div>
      {/* Background removed per request to hide grid */}

      {/* SVG gradients for nodes */}
      <svg
        width="0"
        height="0"
        style={{ position: "absolute" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="node-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.95)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.85)" />
          </linearGradient>
        </defs>
      </svg>

      <Space
        onCreate={setViewPort}
        onUpdated={debouncedOnZoomChange}
        treatTwoFingerTrackPadGesturesLikeTouch
        pollForElementResizing
        className="h-full w-full cursor-move rounded-lg bg-transparent"
      >
        <GraphCanvas />
      </Space>

      <ZoomControls />

      {/* Custom CSS for matched nodes */}
      <style jsx global>{`
        .json-viz-matched {
          outline: 2px solid rgb(245, 158, 11, 0.6);
          outline-offset: 2px;
        }
        .json-viz-current-match {
          outline: 2px solid rgb(59, 130, 246);
          outline-offset: 2px;
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
