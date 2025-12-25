"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { useGraphStore } from "@/lib/tools/json-viz/store";
import { truncate } from "@/lib/tools/json-viz/utils";
import type { JsonNode, JsonVisualizerResultData } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

interface TreeViewProps {
  data: JsonVisualizerResultData;
}

interface TreeNodeProps {
  node: JsonNode;
  depth: number;
  collapsed: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (node: JsonNode) => void;
  selectedPath: string;
  matchedPaths: Set<string>;
}

/**
 * Recursive tree node component
 */
const TreeNode = React.memo(
  ({
    node,
    depth,
    collapsed,
    onToggle,
    onSelect,
    selectedPath,
    matchedPaths,
  }: TreeNodeProps) => {
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsed.has(node.path);
    const isSelected = selectedPath === node.path;
    const isMatched = matchedPaths.has(node.path);

    return (
      <div>
        <button
          type="button"
          className={cn(
            "flex w-full items-start gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60 cursor-pointer text-left",
            isSelected && "bg-primary/10 ring-1 ring-primary/30",
            isMatched && "bg-amber-500/10 ring-1 ring-amber-500/30",
          )}
          style={{ marginLeft: depth * 16 }}
          onClick={() => onSelect(node)}
        >
          <button
            type="button"
            className={cn(
              "mt-0.5 flex size-5 items-center justify-center rounded border text-muted-foreground transition",
              hasChildren
                ? "hover:border-primary hover:text-primary"
                : "opacity-50 cursor-default",
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) onToggle(node.path);
            }}
          >
            {hasChildren ? (
              isCollapsed ? (
                <ChevronRight className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )
            ) : (
              <span className="text-[10px]">•</span>
            )}
          </button>

          <div className="flex-1 space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-medium text-foreground truncate">
                {node.key ?? "root"}
              </span>
              <Badge
                variant="outline"
                className="shrink-0 text-[10px] h-4 px-1"
              >
                {node.type === "value" ? node.valueType : node.type}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {truncate(node.preview, 60)}
            </p>
            <p className="text-[10px] text-muted-foreground/70 font-mono truncate">
              {node.path || "/"}
            </p>
          </div>
        </button>

        {hasChildren && !isCollapsed && (
          <div className="border-l border-dashed border-muted-foreground/30 ml-4">
            {node.children?.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                collapsed={collapsed}
                onToggle={onToggle}
                onSelect={onSelect}
                selectedPath={selectedPath}
                matchedPaths={matchedPaths}
              />
            ))}
          </div>
        )}
      </div>
    );
  },
);

TreeNode.displayName = "TreeNode";

/**
 * TreeView component with collapsible nodes
 */
export function TreeView({ data }: TreeViewProps) {
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = React.useState(data.root.path);
  const _matchedNodes = useGraphStore((state) => state.matchedNodes);
  const searchQuery = useGraphStore((state) => state.searchQuery);

  // Seed initial collapsed state for deep nodes
  React.useEffect(() => {
    const defaults = new Set<string>();
    const stack: Array<{ item: JsonNode; level: number }> = [
      { item: data.root, level: 0 },
    ];

    while (stack.length) {
      const next = stack.pop();
      if (!next) break;

      const { item, level } = next;
      if (level >= 4 && item.children && item.children.length > 0) {
        defaults.add(item.path);
      }

      if (item.children) {
        for (const child of item.children) {
          stack.push({ item: child, level: level + 1 });
        }
      }
    }

    setCollapsed(defaults);
  }, [data.root]);

  // Build matched paths set from search
  const matchedPaths = React.useMemo(() => {
    const paths = new Set<string>();
    if (!searchQuery.trim()) return paths;

    const queue = [data.root];
    while (queue.length) {
      const node = queue.shift();
      if (!node) continue;

      const keyMatch = (node.key ?? "root")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const valueMatch = node.preview
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const pathMatch = node.path
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      if (keyMatch || valueMatch || pathMatch) {
        paths.add(node.path);
      }

      if (node.children) {
        queue.push(...node.children);
      }
    }

    return paths;
  }, [data.root, searchQuery]);

  const handleToggle = (path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleSelect = (node: JsonNode) => {
    setSelectedPath(node.path);
  };

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border bg-muted/10">
      <div
        className="h-full w-full space-y-1 overflow-y-auto bg-background p-3"
        role="tree"
        aria-label="JSON structure"
      >
        <TreeNode
          node={data.root}
          depth={0}
          collapsed={collapsed}
          onToggle={handleToggle}
          onSelect={handleSelect}
          selectedPath={selectedPath}
          matchedPaths={matchedPaths}
        />
      </div>
    </div>
  );
}
