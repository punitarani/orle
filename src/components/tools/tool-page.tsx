"use client";

import {
  ArrowLeftRight,
  Copy,
  Download,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@/hooks/use-clipboard";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type {
  ColorResultData,
  DiffResultData,
  ImageResultData,
  ToolDefinition,
} from "@/lib/tools/types";
import { useTool } from "@/lib/tools/use-tool";
import { ColorOutput } from "./color-output";
import { DiffOutput } from "./diff-output";
import { DualInput } from "./dual-input";
import { ImageToolOutput } from "./image-tool-output";
import { ToolExamples } from "./tool-examples";
import { ToolInput, type ToolInputRef } from "./tool-input";
import { ToolOptions } from "./tool-options";
import { ToolOutput } from "./tool-output";

function OutputActions({
  value,
  downloadFilename = "output.txt",
}: {
  value: string;
  downloadFilename?: string;
}) {
  const { copy } = useClipboard();

  if (!value) return null;

  const handleDownload = () => {
    // Check if it's a data URL or blob URL
    if (value.startsWith("data:") || value.startsWith("blob:")) {
      const a = document.createElement("a");
      a.href = value;
      a.download = downloadFilename;
      a.click();
      return;
    }

    // Otherwise download as text
    const blob = new Blob([value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={() => copy(value)}
      >
        <Copy className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={handleDownload}
      >
        <Download className="size-3.5" />
      </Button>
    </div>
  );
}

type ToolPageProps = {
  tool: ToolDefinition;
  initialInput?: string;
  initialOptions?: Record<string, unknown>;
};

export function ToolPage({
  tool,
  initialInput,
  initialOptions,
}: ToolPageProps) {
  const { copy } = useClipboard();
  const {
    input,
    input2,
    output,
    outputData,
    options,
    isProcessing,
    error,
    file,
    setInput,
    setInput2,
    setFile,
    setOption,
    runTransform,
    clear,
    clearFile,
    swap,
    loadExample,
  } = useTool(tool, initialInput, initialOptions);

  const toolInputRef = useRef<ToolInputRef>(null);
  const [hasFile, setHasFile] = useState(false);

  // Track file state from ToolInput
  useEffect(() => {
    setHasFile(!!file);
  }, [file]);

  const handleClearFile = () => {
    toolInputRef.current?.clearFile();
    clearFile();
  };

  // Render the appropriate output component based on type and data
  const renderOutput = () => {
    if (error) {
      return (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      );
    }

    if (isProcessing) {
      return (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border bg-muted/30">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="text-sm">Processing...</span>
          </div>
        </div>
      );
    }

    // Specialized output components based on outputData type
    if (outputData) {
      if (outputData.type === "image-result") {
        return <ImageToolOutput data={outputData as ImageResultData} />;
      }

      if (outputData.type === "color") {
        return <ColorOutput data={outputData as ColorResultData} />;
      }

      if (outputData.type === "diff") {
        return <DiffOutput data={outputData as DiffResultData} />;
      }
    }

    // Default text output
    return (
      <ToolOutput
        type={tool.outputType}
        value={output}
        error={error}
        isProcessing={isProcessing}
        placeholder={tool.outputPlaceholder}
      />
    );
  };

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
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{tool.name}</h1>
          <p className="text-sm text-muted-foreground">{tool.description}</p>
          {tool.aliases.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {tool.aliases.slice(0, 4).map((alias) => (
                <Badge
                  key={alias}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {alias}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {tool.allowSwap && (
            <Button
              variant="ghost"
              size="sm"
              onClick={swap}
              disabled={!output}
              className="h-8"
            >
              <ArrowLeftRight className="size-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={clear} className="h-8">
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Options */}
      {tool.options && tool.options.length > 0 && (
        <ToolOptions
          options={tool.options}
          values={options}
          onChange={setOption}
        />
      )}

      {/* Dual Input for diff tools */}
      {tool.inputType === "dual" && (
        <>
          <DualInput
            value1={input}
            value2={input2 || ""}
            onChange1={setInput}
            onChange2={setInput2}
            placeholder1="Enter original text..."
            placeholder2="Enter modified text..."
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Differences
              </span>
              <OutputActions value={output} />
            </div>
            {renderOutput()}
          </div>
        </>
      )}

      {/* Input/Output for non-dual tools */}
      {tool.inputType !== "dual" && tool.inputType !== "none" && (
        <div className="grid gap-6 md:grid-cols-2 md:items-start">
          {/* Input with Run button */}
          <div className="flex flex-col gap-2">
            <div className="flex h-7 items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Input
              </span>
              {hasFile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={handleClearFile}
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>
            <ToolInput
              ref={toolInputRef}
              type={tool.inputType}
              value={input}
              onChange={setInput}
              onFileChange={setFile}
              placeholder={tool.inputPlaceholder}
            />
            {tool.inputType === "text" && (
              <Button
                onClick={runTransform}
                disabled={!input || isProcessing}
                className="self-end"
              >
                <Play className="mr-2 size-4" />
                Run
              </Button>
            )}
          </div>

          {/* Output */}
          <div className="flex flex-col gap-2">
            <div className="flex h-7 items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Output
              </span>
              <OutputActions
                value={
                  outputData?.type === "image-result"
                    ? (outputData as ImageResultData).resultUrl
                    : output
                }
                downloadFilename={
                  outputData?.type === "image-result"
                    ? (outputData as ImageResultData).filename
                    : "output.txt"
                }
              />
            </div>
            {renderOutput()}
          </div>
        </div>
      )}

      {/* Generator tools (no input) */}
      {tool.inputType === "none" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Output
              </span>
              <OutputActions value={output} />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runTransform}
              className="h-8"
            >
              <Play className="mr-2 size-3.5" />
              Generate
            </Button>
          </div>
          {renderOutput()}
        </div>
      )}

      {/* Examples */}
      {tool.examples && tool.examples.length > 0 && (
        <ToolExamples examples={tool.examples} onLoad={loadExample} />
      )}
    </div>
  );
}
