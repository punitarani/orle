import type { ViewPort } from "react-zoomable-ui";

/**
 * Represents a single row in an object node (key-value pair)
 */
export type NodeRow = {
  key: string | null;
  value: string | number | null;
  type: "object" | "array" | "value";
  childrenCount?: number;
};

/**
 * Graph node data compatible with reaflow
 */
export type GraphNodeData = {
  id: string;
  data: NodeRow[]; // Array of rows for object properties (renamed from 'text' to avoid ELK conflicts)
  width: number;
  height: number;
  x?: number;
  y?: number;
  /**
   * Original JSON pointer-style path for display/search (ids are sanitized for ELK)
   */
  path?: string;
};

/**
 * Graph edge data connecting nodes
 */
export type GraphEdgeData = {
  id: string;
  from: string;
  to: string;
  label: string | null; // Edge label (property name) - renamed from 'text' to avoid ELK conflicts
};

/**
 * Complete graph structure for visualization
 */
export type Graph = {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
};

/**
 * Zustand store state interface
 */
export interface GraphStore {
  // Core data
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];

  // View state
  viewPort: ViewPort | null;
  direction: "RIGHT" | "DOWN";
  selectedNode: GraphNodeData | null;
  loading: boolean;

  // Search
  searchQuery: string;
  matchedNodes: Set<string>;
  currentMatchIndex: number;

  // Actions
  setGraph: (nodes: GraphNodeData[], edges: GraphEdgeData[]) => void;
  setViewPort: (viewPort: ViewPort) => void;
  setSelectedNode: (node: GraphNodeData | null) => void;
  setSearchQuery: (query: string) => void;
  setDirection: (direction: "RIGHT" | "DOWN") => void;
  nextMatch: () => void;
  previousMatch: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  centerView: () => void;
  focusNode: (nodeId: string) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Node dimensions constants
 */
export const NODE_DIMENSIONS = {
  ROW_HEIGHT: 24,
  PARENT_HEIGHT: 36,
  MIN_WIDTH: 160,
  MAX_WIDTH: 700,
  PADDING: 10,
} as const;
