import type { GraphNodeData, NodeRow } from "./types";
import { NODE_DIMENSIONS } from "./types";

/**
 * Calculate node dimensions based on content
 */
export function calculateNodeSize(
  data: NodeRow[],
  _isParent = false,
): { width: number; height: number } {
  if (data.length === 0) {
    return {
      width: NODE_DIMENSIONS.MIN_WIDTH,
      height: NODE_DIMENSIONS.PARENT_HEIGHT,
    };
  }

  // For single row nodes (primitives)
  if (data.length === 1 && data[0].type === "value") {
    const content = String(data[0].value ?? "");
    const width = Math.min(
      Math.max(
        content.length * 7 + NODE_DIMENSIONS.PADDING * 2,
        NODE_DIMENSIONS.MIN_WIDTH,
      ),
      NODE_DIMENSIONS.MAX_WIDTH,
    );
    return { width, height: NODE_DIMENSIONS.PARENT_HEIGHT };
  }

  // For multi-row nodes (objects/arrays)
  const maxKeyLength = Math.max(
    ...data.map((row) => (row.key ? row.key.length : 0)),
  );
  const maxValueLength = Math.max(
    ...data.map((row) => String(row.value ?? "").length),
  );

  const estimatedWidth = Math.min(
    Math.max(
      (maxKeyLength + maxValueLength) * 7 + NODE_DIMENSIONS.PADDING * 4,
      NODE_DIMENSIONS.MIN_WIDTH,
    ),
    NODE_DIMENSIONS.MAX_WIDTH,
  );

  const height = data.length * NODE_DIMENSIONS.ROW_HEIGHT;

  return { width: estimatedWidth, height };
}

/**
 * Format value preview for display
 */
export function formatPreview(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") {
    const trimmed = value.trim();
    const alreadyQuoted = /^".*"$/.test(trimmed);
    const inner = alreadyQuoted ? trimmed.slice(1, -1) : trimmed;
    const safe = inner.length > 50 ? `${inner.substring(0, 47)}...` : inner;
    return `"${safe}"`;
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  return String(value);
}

/**
 * Get display text for a row value
 */
export function getRowDisplayValue(row: NodeRow): string {
  if (row.type === "object") {
    return `{${row.childrenCount ?? 0} keys}`;
  }
  if (row.type === "array") {
    return `[${row.childrenCount ?? 0} items]`;
  }
  return formatPreview(row.value);
}

/**
 * Check if a string is a valid URL
 */
export function isURL(str: string): boolean {
  if (typeof str !== "string") return false;
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Check if a string is a color format (hex, rgb, hsl)
 */
export function isColorFormat(str: string): boolean {
  if (typeof str !== "string") return false;

  // Hex color
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(str)) return true;

  // RGB/RGBA
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/.test(str))
    return true;

  // HSL/HSLA
  if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+\s*)?\)$/.test(str))
    return true;

  return false;
}

/**
 * Check if content is an image URL or base64
 */
export function isContentImage(str: string): boolean {
  if (typeof str !== "string") return false;

  // Check for image URLs
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;
  if (imageExtensions.test(str)) return true;

  // Check for base64 images
  if (str.startsWith("data:image/")) return true;

  return false;
}

/**
 * Search for matching nodes in the graph
 */
export function searchNodes(
  nodes: GraphNodeData[],
  query: string,
): Set<string> {
  const matches = new Set<string>();
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) return matches;

  for (const node of nodes) {
    const path = (node.path ?? node.id ?? "").toLowerCase();

    // Search in path (node.id serves as path)
    if (path.includes(lowerQuery)) {
      matches.add(node.id);
      continue;
    }

    // Search in rows
    for (const row of node.data) {
      const keyMatch = row.key?.toLowerCase().includes(lowerQuery);
      const valueMatch = String(row.value ?? "")
        .toLowerCase()
        .includes(lowerQuery);

      if (keyMatch || valueMatch) {
        matches.add(node.id);
        break;
      }
    }
  }

  return matches;
}

/**
 * Highlight matched nodes in DOM
 */
export function highlightMatchedNodes(
  matchedNodeIds: Set<string>,
  currentNodeId?: string,
): void {
  // Batch DOM work to the next frame to avoid layout thrash.
  window.requestAnimationFrame(() => {
    const previousHighlights = document.querySelectorAll(
      ".json-viz-matched, .json-viz-current-match",
    );
    previousHighlights.forEach((el) => {
      el.classList.remove("json-viz-matched", "json-viz-current-match");
    });

    for (const nodeId of matchedNodeIds) {
      const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
      if (nodeElement) {
        nodeElement.classList.add("json-viz-matched");
        if (currentNodeId === nodeId) {
          nodeElement.classList.add("json-viz-current-match");
        }
      }
    }
  });
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 1)}…`;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
