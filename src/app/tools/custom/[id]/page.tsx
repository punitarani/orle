"use client";

import {
  ArrowLeft,
  Copy,
  Download,
  Play,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { DualInput } from "@/components/tools/dual-input";
import { ToolExamples } from "@/components/tools/tool-examples";
import { ToolInput, type ToolInputRef } from "@/components/tools/tool-input";
import { ToolOptions } from "@/components/tools/tool-options";
import { ToolOutput } from "@/components/tools/tool-output";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@/hooks/use-clipboard";
import { deleteCustomTool, getCustomTool } from "@/lib/tools/custom-tools-db";
import { executeTransform } from "@/lib/tools/safe-executor";
import type { CustomToolDefinition } from "@/lib/tools/types";

const DEBOUNCE_DELAY = 300;

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
    if (value.startsWith("data:") || value.startsWith("blob:")) {
      const a = document.createElement("a");
      a.href = value;
      a.download = downloadFilename;
      a.click();
      return;
    }

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

export default function CustomToolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [tool, setTool] = useState<CustomToolDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  // Tool state
  const [input, setInputState] = useState("");
  const [input2, setInput2State] = useState("");
  const [output, setOutput] = useState("");
  const [options, setOptions] = useState<Record<string, unknown>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const toolInputRef = useRef<ToolInputRef>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionsRef = useRef<Record<string, unknown>>({});

  // Keep optionsRef in sync
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const runTransformWithTool = useCallback(
    async (
      t: CustomToolDefinition,
      inputValue: string | File,
      opts: Record<string, unknown>,
    ) => {
      setIsProcessing(true);
      setError(null);

      try {
        const result = await executeTransform(
          t.transformCode,
          inputValue,
          opts,
        );

        if (typeof result === "string") {
          setOutput(result);
        } else if (result && typeof result === "object") {
          if (result.type === "error") {
            setError(result.message);
            setOutput("");
          } else if (result.type === "image") {
            setOutput(result.data);
          } else {
            setOutput(JSON.stringify(result, null, 2));
          }
        }
      } catch (e) {
        setError((e as Error).message);
        setOutput("");
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  // Load tool from IndexedDB
  useEffect(() => {
    async function loadTool() {
      try {
        const loadedTool = await getCustomTool(id);
        if (!loadedTool) {
          setNotFoundState(true);
          return;
        }
        setTool(loadedTool);

        // Initialize options with defaults
        const defaults: Record<string, unknown> = {};
        if (loadedTool.options) {
          for (const opt of loadedTool.options) {
            defaults[opt.id] = opt.default;
          }
        }
        setOptions(defaults);
        optionsRef.current = defaults;

        // Auto-run for generator tools
        if (loadedTool.inputType === "none") {
          runTransformWithTool(loadedTool, "", defaults);
        }
      } catch (e) {
        console.error("Failed to load tool:", e);
        setNotFoundState(true);
      } finally {
        setLoading(false);
      }
    }
    loadTool();
  }, [id, runTransformWithTool]);

  const runTransform = useCallback(() => {
    if (!tool) return;
    if (input || tool.inputType === "none") {
      runTransformWithTool(tool, input, options);
    }
  }, [tool, input, options, runTransformWithTool]);

  const handleInputChange = useCallback(
    (value: string) => {
      setInputState(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        if (tool) {
          runTransformWithTool(tool, value, optionsRef.current);
        }
      }, DEBOUNCE_DELAY);
    },
    [tool, runTransformWithTool],
  );

  const handleInput2Change = useCallback(
    (value: string) => {
      setInput2State(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        if (tool) {
          const combined = `${input}\n---SEPARATOR---\n${value}`;
          runTransformWithTool(tool, combined, optionsRef.current);
        }
      }, DEBOUNCE_DELAY);
    },
    [tool, input, runTransformWithTool],
  );

  const handleFileChange = useCallback(
    (f: File) => {
      setFile(f);
      if (tool) {
        runTransformWithTool(tool, f, options);
      }
    },
    [tool, options, runTransformWithTool],
  );

  const handleOptionChange = useCallback(
    (optId: string, value: unknown) => {
      const newOptions = { ...options, [optId]: value };
      setOptions(newOptions);
      if (tool && (input || tool.inputType === "none")) {
        runTransformWithTool(tool, input, newOptions);
      }
    },
    [tool, input, options, runTransformWithTool],
  );

  const handleClear = useCallback(() => {
    setInputState("");
    setInput2State("");
    setOutput("");
    setError(null);
    setFile(null);
  }, []);

  const handleClearFile = useCallback(() => {
    toolInputRef.current?.clearFile();
    setFile(null);
    setOutput("");
    setError(null);
  }, []);

  const handleLoadExample = useCallback(
    (example: { input: string }) => {
      handleInputChange(example.input);
    },
    [handleInputChange],
  );

  const handleDelete = async () => {
    if (!tool) return;
    await deleteCustomTool(tool.id);
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFoundState || !tool) {
    notFound();
  }

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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="size-8">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">
              {tool.name}
            </h1>
            <Badge variant="secondary" className="text-xs">
              Custom
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground pl-10">
            {tool.description}
          </p>
          {tool.aliases.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1 pl-10">
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8"
          >
            <RotateCcw className="size-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Custom Tool</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{tool.name}&quot;? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Options */}
      {tool.options && tool.options.length > 0 && (
        <ToolOptions
          options={tool.options}
          values={options}
          onChange={handleOptionChange}
        />
      )}

      {/* Dual Input for diff tools */}
      {tool.inputType === "dual" && (
        <>
          <DualInput
            value1={input}
            value2={input2}
            onChange1={handleInputChange}
            onChange2={handleInput2Change}
            placeholder1="Enter original text..."
            placeholder2="Enter modified text..."
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Output
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
          <div className="flex flex-col gap-2">
            <div className="flex h-7 items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Input
              </span>
              {file && (
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
              onChange={handleInputChange}
              onFileChange={handleFileChange}
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

          <div className="flex flex-col gap-2">
            <div className="flex h-7 items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Output
              </span>
              <OutputActions value={output} />
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
        <ToolExamples examples={tool.examples} onLoad={handleLoadExample} />
      )}
    </div>
  );
}
