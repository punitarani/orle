import type { JsonNode, JsonVisualizerResultData } from "../types";
import type { Graph, GraphEdgeData, GraphNodeData, NodeRow } from "./types";
import { calculateNodeSize } from "./utils";

/**
 * Normalize a JSON-pointer-like path so ELK receives stable, slash-free ids.
 * Keeps a separate `path` on nodes for display/search.
 */
function sanitizeGraphId(path: string | null | undefined): string {
  // Collapse multiple slashes and trim leading/trailing slashes
  const normalized = (path ?? "")
    .replace(/\/+/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  const base = normalized.length > 0 ? normalized : "root";

  // Replace characters ELK may dislike with safe underscores
  return base.replace(/[^A-Za-z0-9_-]/g, "_");
}

/**
 * Parse JsonNode tree into reaflow-compatible graph structure
 */
export function parseJsonToGraph(data: JsonVisualizerResultData): Graph {
  const nodes: GraphNodeData[] = [];
  const edges: GraphEdgeData[] = [];
  let edgeIdCounter = 0;

  function traverse(
    jsonNode: JsonNode,
    parentId?: string,
    edgeLabel?: string,
  ): string {
    const originalPath = jsonNode.id || jsonNode.path || "/";
    const nodeId = sanitizeGraphId(originalPath);

    // Handle value nodes (primitives)
    if (jsonNode.type === "value") {
      const row: NodeRow = {
        key: jsonNode.key,
        value: jsonNode.preview,
        type: "value",
      };

      const { width, height } = calculateNodeSize([row]);

      nodes.push({
        id: nodeId,
        path: originalPath,
        data: [row],
        width,
        height,
      });

      // Create edge from parent if exists
      if (parentId) {
        edges.push({
          id: `edge-${edgeIdCounter++}`,
          from: parentId,
          to: nodeId,
          label: edgeLabel ?? "",
        });
      }

      return nodeId;
    }

    // Handle array nodes
    if (jsonNode.type === "array") {
      const childCount = jsonNode.children?.length ?? 0;

      // For root arrays or arrays as properties, create a parent node
      const isRootArray = !parentId || !jsonNode.key;

      if (isRootArray) {
        const row: NodeRow = {
          key: jsonNode.key,
          value: `[${childCount} items]`,
          type: "array",
          childrenCount: childCount,
        };

        const { width, height } = calculateNodeSize([row]);

        nodes.push({
          id: nodeId,
          path: originalPath,
          data: [row],
          width,
          height,
        });

        // Create edge from parent if exists
        if (parentId) {
          edges.push({
            id: `edge-${edgeIdCounter++}`,
            from: parentId,
            to: nodeId,
            label: edgeLabel ?? "",
          });
        }

        // Traverse children and create edges
        jsonNode.children?.forEach((child, _index) => {
          traverse(child, nodeId, undefined);
        });

        return nodeId;
      }

      // If array is a property value, handle inline
      const rows: NodeRow[] = [
        {
          key: jsonNode.key,
          value: `[${childCount} items]`,
          type: "array",
          childrenCount: childCount,
        },
      ];

      const { width, height } = calculateNodeSize(rows);

      nodes.push({
        id: nodeId,
        path: originalPath,
        data: rows,
        width,
        height,
      });

      // Create edge from parent if exists
      if (parentId) {
        edges.push({
          id: `edge-${edgeIdCounter++}`,
          from: parentId,
          to: nodeId,
          label: edgeLabel ?? "",
        });
      }

      // Traverse children to create their nodes and edges
      jsonNode.children?.forEach((child) => {
        traverse(child, nodeId, undefined);
      });

      return nodeId;
    }

    // Handle object nodes
    if (jsonNode.type === "object") {
      const children = jsonNode.children ?? [];
      const rows: NodeRow[] = [];
      const _childNodeIds: string[] = [];

      // Process each property
      for (const child of children) {
        if (child.type === "value") {
          // Inline primitive values
          rows.push({
            key: child.key,
            value: child.preview,
            type: "value",
          });
        } else {
          // Complex values (objects/arrays) get their own nodes
          // Edge will be created in the traverse call
          traverse(child, nodeId, child.key ?? undefined);

          rows.push({
            key: child.key,
            value:
              child.type === "object"
                ? `{${child.children?.length ?? 0} keys}`
                : `[${child.children?.length ?? 0} items]`,
            type: child.type,
            childrenCount: child.children?.length ?? 0,
          });
        }
      }

      const { width, height } = calculateNodeSize(rows, true);

      nodes.push({
        id: nodeId,
        path: originalPath,
        data: rows,
        width,
        height,
      });

      // Create edge from parent if exists
      if (parentId) {
        edges.push({
          id: `edge-${edgeIdCounter++}`,
          from: parentId,
          to: nodeId,
          label: edgeLabel ?? "",
        });
      }

      return nodeId;
    }

    return nodeId;
  }

  // Start traversal from root
  traverse(data.root);

  // Validate and log parsed data
  console.log(
    "Parser output:",
    JSON.stringify(
      {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        sampleNodes: nodes.slice(0, 3),
        sampleEdges: edges.slice(0, 3),
      },
      null,
      2,
    ),
  );

  // Ensure all nodes have valid dimensions
  for (const node of nodes) {
    if (!node.width || !node.height || !node.id || !node.data) {
      console.error("Invalid node detected:", JSON.stringify(node, null, 2));
    }
  }

  return { nodes, edges };
}
