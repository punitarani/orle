"use client";

import { Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@/hooks/use-clipboard";
import { useGraphStore } from "@/lib/tools/json-viz/store";
import { truncate } from "@/lib/tools/json-viz/utils";

interface NodeDetailsProps {
  rawOutput?: string;
}

/**
 * NodeDetails sidebar showing information about the selected node
 */
export function NodeDetails({ rawOutput }: NodeDetailsProps) {
  const selectedNode = useGraphStore((state) => state.selectedNode);
  const { copy } = useClipboard();

  if (!selectedNode) {
    return (
      <aside className="space-y-3 rounded-lg border bg-muted/20 p-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Node details</p>
          <p className="text-xs text-muted-foreground">
            Click any node to see its path and details.
          </p>
        </div>
      </aside>
    );
  }

  const nodeType = selectedNode.data[0]?.type;
  const valueType = typeof selectedNode.data[0]?.value;
  const preview = selectedNode.data
    .map((row) => {
      if (row.key) {
        return `${row.key}: ${row.value}`;
      }
      return String(row.value);
    })
    .join("\n");

  return (
    <aside className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Node details</p>
          <p className="text-xs text-muted-foreground">
            Selected node information
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          onClick={() => copy(selectedNode.path || "/")}
          title="Copy path"
        >
          <Copy className="size-4" />
        </Button>
      </div>

      <div className="space-y-3 rounded-md border bg-background p-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{nodeType}</Badge>
          {nodeType === "value" && (
            <Badge variant="outline" className="text-[11px]">
              {valueType}
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Path
          </p>
          <p className="break-all font-mono text-xs">
            {selectedNode.path || "/"}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Preview
          </p>
          <p className="whitespace-pre-wrap break-all font-mono text-xs text-foreground">
            {truncate(preview, 200)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            size="sm"
            variant="secondary"
            className="gap-2"
            onClick={() => copy(preview)}
          >
            <Copy className="size-3.5" />
            Copy value
          </Button>
          {rawOutput && (
            <Button size="sm" variant="ghost" onClick={() => copy(rawOutput)}>
              Copy JSON
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2 rounded-md border bg-background p-3">
        <p className="text-sm font-medium">Navigation tips</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>• Drag to pan, scroll to zoom</li>
          <li>• Click nodes to select and view details</li>
          <li>• Click edges to focus target nodes</li>
          <li>• Use search to find specific keys/values</li>
        </ul>
      </div>
    </aside>
  );
}
