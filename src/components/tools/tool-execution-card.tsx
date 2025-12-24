"use client";

import {
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Loader2,
  PlayCircle,
  Search,
  Settings,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ToolExecutionProps {
  name: string;
  description?: string;
  status: "input-streaming" | "input-available" | "output-available";
  parameters?: Record<string, unknown>;
  result?: string | object;
  error?: string;
}

const TOOL_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  searchExistingTools: Search,
  generateToolDefinition: Settings,
  validateToolDefinition: CheckSquare,
  testToolRuntime: PlayCircle,
};

const TOOL_LABELS: Record<string, string> = {
  searchExistingTools: "Searching existing tools",
  generateToolDefinition: "Generating tool",
  validateToolDefinition: "Validation",
  testToolRuntime: "Testing",
};

function getStatusIcon(status: ToolExecutionProps["status"], error?: string) {
  if (error) {
    return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
  }

  switch (status) {
    case "input-streaming":
    case "input-available":
      return (
        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
      );
    case "output-available":
      return <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />;
    default:
      return null;
  }
}

function _formatValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (value === null || value === undefined) return "null";
  return JSON.stringify(value, null, 2);
}

export function ToolExecutionCard({
  name,
  description: _description,
  status,
  parameters,
  result,
  error,
}: ToolExecutionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const Icon = TOOL_ICONS[name] || Settings;
  const label = TOOL_LABELS[name] || name;
  const isComplete = status === "output-available";
  const _isRunning =
    status === "input-streaming" || status === "input-available";
  const hasDetails = parameters || result || error;

  // Format result display
  let resultDisplay: string | null = null;
  if (error) {
    resultDisplay = error;
  } else if (result) {
    if (typeof result === "object" && "message" in result) {
      resultDisplay = (result as { message: string }).message;
    } else if (typeof result === "string") {
      resultDisplay = result;
    } else {
      resultDisplay = JSON.stringify(result, null, 2);
    }
  }

  return (
    <Card
      className={cn(
        "border-l-4 transition-colors",
        error
          ? "border-l-destructive bg-destructive/5"
          : isComplete
            ? "border-l-green-600 bg-green-50/50 dark:bg-green-950/20"
            : "border-l-blue-600 bg-blue-50/50 dark:bg-blue-950/20",
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {/* Icon and Status */}
          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            <Icon className="h-4 w-4 text-muted-foreground" />
            {getStatusIcon(status, error)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium truncate">{label}</h4>
              {hasDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>

            {/* Brief result or status */}
            {!isExpanded && isComplete && resultDisplay && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {resultDisplay.length > 60
                  ? `${resultDisplay.substring(0, 60)}...`
                  : resultDisplay}
              </p>
            )}

            {/* Expanded details */}
            {isExpanded && (
              <div className="mt-3 space-y-2">
                {/* Parameters */}
                {parameters && Object.keys(parameters).length > 0 && (
                  <div>
                    <Badge variant="outline" className="text-xs mb-1.5">
                      Parameters
                    </Badge>
                    <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto">
                      {JSON.stringify(parameters, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Result */}
                {resultDisplay && (
                  <div>
                    <Badge
                      variant={error ? "destructive" : "outline"}
                      className="text-xs mb-1.5"
                    >
                      {error ? "Error" : "Result"}
                    </Badge>
                    <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                      {resultDisplay}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Specialized renderer for searchExistingTools results
export function SearchToolsResult({ result }: { result: unknown }) {
  if (!result || typeof result !== "object") return null;

  const data = result as {
    tools?: Array<{
      name: string;
      description: string;
      slug: string;
      matchScore: number;
    }>;
  };
  const tools = data.tools || [];

  if (tools.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No similar tools found</p>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium">
        Found {tools.length} similar tool{tools.length > 1 ? "s" : ""}:
      </p>
      <div className="space-y-1">
        {tools.slice(0, 3).map((tool) => (
          <div
            key={tool.slug}
            className="text-xs border-l-2 border-muted pl-2 py-0.5"
          >
            <div className="font-medium">{tool.name}</div>
            <div className="text-muted-foreground text-[10px] line-clamp-1">
              {tool.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
