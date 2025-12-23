"use client";

import { ArrowLeftRight, Play, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@/hooks/use-clipboard";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type { ToolDefinition } from "@/lib/tools/types";
import { useTool } from "@/lib/tools/use-tool";
import { ToolExamples } from "./tool-examples";
import { ToolInput } from "./tool-input";
import { ToolOptions } from "./tool-options";
import { ToolOutput } from "./tool-output";

type ToolPageProps = {
  tool: ToolDefinition;
};

export function ToolPage({ tool }: ToolPageProps) {
  const { copy } = useClipboard();
  const {
    input,
    output,
    options,
    isProcessing,
    error,
    setInput,
    setFile,
    setOption,
    runTransform,
    clear,
    swap,
    loadExample,
  } = useTool(tool);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: "Enter", metaKey: true, handler: runTransform },
    {
      key: "c",
      metaKey: true,
      shiftKey: true,
      handler: () => output && copy(output),
    },
    { key: "Escape", handler: clear },
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {tool.name}
            </h1>
            <p className="mt-1 text-muted-foreground">{tool.description}</p>
          </div>
          <div className="flex gap-2">
            {tool.allowSwap && (
              <Button
                variant="outline"
                size="sm"
                onClick={swap}
                disabled={!output}
              >
                <ArrowLeftRight className="mr-2 size-4" />
                Swap
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={clear}>
              <RotateCcw className="mr-2 size-4" />
              Clear
            </Button>
          </div>
        </div>
        {tool.aliases.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tool.aliases.slice(0, 5).map((alias) => (
              <Badge key={alias} variant="secondary" className="text-xs">
                {alias}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Options */}
      {tool.options && tool.options.length > 0 && (
        <ToolOptions
          options={tool.options}
          values={options}
          onChange={setOption}
        />
      )}

      {/* Input/Output Grid */}
      <div
        className={
          tool.inputType === "none" ? "grid gap-4" : "grid gap-4 lg:grid-cols-2"
        }
      >
        {/* Input - hide for generator tools */}
        {tool.inputType !== "none" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Input</span>
              {tool.inputType === "text" && (
                <Button variant="ghost" size="sm" onClick={runTransform}>
                  <Play className="mr-2 size-4" />
                  Run
                </Button>
              )}
            </div>
            <ToolInput
              type={tool.inputType}
              value={input}
              onChange={setInput}
              onFileChange={setFile}
              placeholder={tool.inputPlaceholder}
            />
          </div>
        )}

        {/* Output */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Output</span>
            {tool.inputType === "none" && (
              <Button variant="ghost" size="sm" onClick={runTransform}>
                <Play className="mr-2 size-4" />
                Generate
              </Button>
            )}
          </div>
          <ToolOutput
            type={tool.outputType}
            value={output}
            error={error}
            isProcessing={isProcessing}
            placeholder={tool.outputPlaceholder}
          />
        </div>
      </div>

      {/* Examples */}
      {tool.examples && tool.examples.length > 0 && (
        <ToolExamples examples={tool.examples} onLoad={loadExample} />
      )}
    </div>
  );
}
