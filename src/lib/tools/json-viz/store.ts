import type { ViewPort } from "react-zoomable-ui";
import { create } from "zustand";
import type { GraphEdgeData, GraphNodeData, GraphStore } from "./types";
import { highlightMatchedNodes, searchNodes } from "./utils";

export const useGraphStore = create<GraphStore>((set, get) => ({
  // Core data
  nodes: [],
  edges: [],

  // View state
  viewPort: null,
  direction: "RIGHT",
  selectedNode: null,
  loading: false,

  // Search
  searchQuery: "",
  matchedNodes: new Set(),
  currentMatchIndex: 0,

  // Actions
  setGraph: (nodes: GraphNodeData[], edges: GraphEdgeData[]) => {
    set({
      nodes,
      edges,
      loading: false,
      selectedNode: nodes[0] ?? null,
    });
  },

  setViewPort: (viewPort: ViewPort) => {
    set({ viewPort });
  },

  setSelectedNode: (node: GraphNodeData | null) => {
    set({ selectedNode: node });
  },

  setSearchQuery: (query: string) => {
    const { nodes } = get();
    const matchedNodes = searchNodes(nodes, query);
    const matchedArray = Array.from(matchedNodes);

    set({
      searchQuery: query,
      matchedNodes,
      currentMatchIndex: matchedArray.length > 0 ? 0 : 0,
    });

    // Highlight matches in DOM
    if (matchedArray.length > 0) {
      highlightMatchedNodes(matchedNodes, matchedArray[0]);
    } else {
      highlightMatchedNodes(new Set());
    }
  },

  setDirection: (direction: "RIGHT" | "DOWN") => {
    set({ direction });
  },

  nextMatch: () => {
    const { matchedNodes, currentMatchIndex } = get();
    const matchedArray = Array.from(matchedNodes);

    if (matchedArray.length === 0) return;

    const nextIndex = (currentMatchIndex + 1) % matchedArray.length;
    set({ currentMatchIndex: nextIndex });

    highlightMatchedNodes(matchedNodes, matchedArray[nextIndex]);

    // Focus the node
    get().focusNode(matchedArray[nextIndex]);
  },

  previousMatch: () => {
    const { matchedNodes, currentMatchIndex } = get();
    const matchedArray = Array.from(matchedNodes);

    if (matchedArray.length === 0) return;

    const prevIndex =
      currentMatchIndex === 0 ? matchedArray.length - 1 : currentMatchIndex - 1;
    set({ currentMatchIndex: prevIndex });

    highlightMatchedNodes(matchedNodes, matchedArray[prevIndex]);

    // Focus the node
    get().focusNode(matchedArray[prevIndex]);
  },

  zoomIn: () => {
    const { viewPort } = get();
    if (!viewPort?.camera) return;

    const currentZoom = viewPort.zoomFactor ?? 1;
    viewPort.camera.recenter(
      viewPort.centerX,
      viewPort.centerY,
      Math.min(currentZoom + 0.15, 2.5),
    );
  },

  zoomOut: () => {
    const { viewPort } = get();
    if (!viewPort?.camera) return;

    const currentZoom = viewPort.zoomFactor ?? 1;
    viewPort.camera.recenter(
      viewPort.centerX,
      viewPort.centerY,
      Math.max(currentZoom - 0.15, 0.3),
    );
  },

  centerView: () => {
    const { viewPort } = get();
    if (!viewPort) return;

    viewPort.updateContainerSize();

    const canvas = document.querySelector(
      ".json-viz-canvas",
    ) as HTMLElement | null;
    if (canvas) {
      viewPort.camera?.centerFitElementIntoView(canvas);
    }
  },

  focusNode: (nodeId: string) => {
    const { viewPort, nodes } = get();
    if (!viewPort) return;

    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      set({ selectedNode: node });
    }

    const nodeElement = document.querySelector(
      `[data-node-id="${nodeId}"]`,
    ) as HTMLElement;

    if (nodeElement?.parentElement) {
      viewPort.camera?.centerFitElementIntoView(nodeElement.parentElement, {
        elementExtraMarginForZoom: 200,
      });
    }
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },
}));
