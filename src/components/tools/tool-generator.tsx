"use client";

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Play,
  Save,
  Sparkles,
  XCircle,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  generateUniqueSlug,
  saveCustomTool,
} from "@/lib/tools/custom-tools-db";
import { testTransform } from "@/lib/tools/safe-executor";
import type {
  CustomToolDefinition,
  CustomToolDefinitionGenerated,
  ValidationResult,
} from "@/lib/tools/types";

type GeneratorState =
  | "idle"
  | "generating"
  | "validating"
  | "testing"
  | "ready"
  | "error";

interface ToolGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ToolGenerator({ open, onOpenChange }: ToolGeneratorProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<GeneratorState>("idle");
  const [generatedTool, setGeneratedTool] =
    useState<CustomToolDefinitionGenerated | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    output?: string;
    error?: string;
    time?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [_streamedJson, setStreamedJson] = useState("");

  const resetState = useCallback(() => {
    setPrompt("");
    setState("idle");
    setGeneratedTool(null);
    setValidation(null);
    setTestResult(null);
    setError(null);
    setStreamedJson("");
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setState("generating");
    setError(null);
    setGeneratedTool(null);
    setValidation(null);
    setTestResult(null);
    setStreamedJson("");

    try {
      const response = await fetch("/api/tools/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate tool");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setStreamedJson(accumulated);
      }

      // Parse the final result
      // The AI SDK streams the object, we need to extract the JSON
      // The stream format includes prefix like "0:" for different types
      const lines = accumulated.split("\n").filter(Boolean);
      let jsonStr = "";

      for (const line of lines) {
        // AI SDK v6 text stream format: e: for data events
        if (line.startsWith("e:")) {
          const data = line.slice(2);
          try {
            const parsed = JSON.parse(data);
            if (parsed.v?.output) {
              jsonStr = JSON.stringify(parsed.v.output);
            }
          } catch {
            // Continue accumulating
          }
        }
        // Also check for d: (done) event with final data
        if (line.startsWith("d:")) {
          const data = line.slice(2);
          try {
            const parsed = JSON.parse(data);
            if (parsed.output) {
              jsonStr = JSON.stringify(parsed.output);
            }
          } catch {
            // Continue
          }
        }
      }

      // If we couldn't parse from stream format, try parsing accumulated directly
      if (!jsonStr) {
        // Try to find JSON object in the accumulated text
        const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }

      if (!jsonStr) {
        throw new Error("Could not parse generated tool from response");
      }

      const tool = JSON.parse(jsonStr) as CustomToolDefinitionGenerated;
      setGeneratedTool(tool);

      // Automatically validate
      setState("validating");
      const validationResponse = await fetch("/api/tools/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool }),
      });

      if (!validationResponse.ok) {
        throw new Error("Failed to validate tool");
      }

      const validationResult =
        (await validationResponse.json()) as ValidationResult;
      setValidation(validationResult);

      // If valid, run a test
      if (validationResult.valid) {
        setState("testing");
        const defaultOpts: Record<string, unknown> = {};
        if (tool.options) {
          for (const opt of tool.options) {
            defaultOpts[opt.id] = opt.default;
          }
        }

        const testInput =
          tool.inputType === "none"
            ? ""
            : tool.examples?.[0]?.input || "test input";

        const result = await testTransform(
          tool.transformCode,
          testInput,
          defaultOpts,
        );

        setTestResult({
          success: result.success,
          output:
            typeof result.result === "string"
              ? result.result
              : JSON.stringify(result.result),
          error: result.error,
          time: result.executionTime,
        });
      }

      setState(validationResult.valid ? "ready" : "error");
    } catch (e) {
      setError((e as Error).message);
      setState("error");
    }
  };

  const handleSave = async () => {
    if (!generatedTool) return;

    try {
      const uniqueSlug = await generateUniqueSlug(generatedTool.slug);
      const fullTool: CustomToolDefinition = {
        ...generatedTool,
        slug: uniqueSlug,
        id: nanoid(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isCustom: true,
      };

      await saveCustomTool(fullTool);
      onOpenChange(false);
      resetState();
      router.push(`/tools/custom/${fullTool.id}`);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const getStateIcon = () => {
    switch (state) {
      case "generating":
        return <Sparkles className="size-4 animate-pulse text-primary" />;
      case "validating":
        return <Loader2 className="size-4 animate-spin text-yellow-500" />;
      case "testing":
        return <Play className="size-4 animate-pulse text-blue-500" />;
      case "ready":
        return <CheckCircle2 className="size-4 text-green-500" />;
      case "error":
        return <XCircle className="size-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStateText = () => {
    switch (state) {
      case "generating":
        return "Generating tool...";
      case "validating":
        return "Validating...";
      case "testing":
        return "Testing transform...";
      case "ready":
        return "Ready to save";
      case "error":
        return "Validation failed";
      default:
        return "";
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetState();
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            Generate Custom Tool
          </DialogTitle>
          <DialogDescription>
            Describe the tool you want to create and AI will generate it for
            you.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          {/* Input */}
          <div className="space-y-2">
            <label
              htmlFor="prompt"
              className="text-sm font-medium text-muted-foreground"
            >
              Describe your tool
            </label>
            <Textarea
              id="prompt"
              placeholder="e.g., A tool that converts CSV data to JSON, with options to choose delimiter and whether to include headers"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={state !== "idle" && state !== "error"}
            />
          </div>

          {/* Status */}
          {state !== "idle" && (
            <div className="flex items-center gap-2 text-sm">
              {getStateIcon()}
              <span>{getStateText()}</span>
            </div>
          )}

          {/* Generated Tool Preview */}
          {generatedTool && (
            <ScrollArea className="h-[200px] rounded-md border p-3">
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-muted-foreground">Name</span>
                  <p className="font-medium">{generatedTool.name}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">
                    Description
                  </span>
                  <p className="text-sm">{generatedTool.description}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Slug</span>
                  <p className="font-mono text-sm">{generatedTool.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">{generatedTool.inputType}</Badge>
                  <Badge variant="secondary">{generatedTool.outputType}</Badge>
                  {generatedTool.options && (
                    <Badge variant="outline">
                      {generatedTool.options.length} options
                    </Badge>
                  )}
                </div>
                {generatedTool.aliases.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {generatedTool.aliases.map((alias) => (
                      <Badge key={alias} variant="outline" className="text-xs">
                        {alias}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Validation Results */}
          {validation && !validation.valid && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="size-4" />
                <span className="text-sm font-medium">Validation Issues</span>
              </div>
              <ul className="text-sm space-y-1">
                {validation.issues.map((issue) => (
                  <li key={issue} className="text-muted-foreground">
                    • {issue}
                  </li>
                ))}
                {validation.securityConcerns?.map((concern) => (
                  <li key={`sec-${concern}`} className="text-destructive">
                    • Security: {concern}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Test Results */}
          {testResult && (
            <div
              className={`rounded-md border p-3 ${
                testResult.success
                  ? "border-green-500/50 bg-green-500/10"
                  : "border-destructive/50 bg-destructive/10"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {testResult.success ? "Test Passed" : "Test Failed"}
                </span>
                {testResult.time && (
                  <span className="text-xs text-muted-foreground">
                    {testResult.time.toFixed(1)}ms
                  </span>
                )}
              </div>
              {testResult.output && (
                <pre className="text-xs font-mono bg-muted/50 p-2 rounded overflow-x-auto max-h-[60px]">
                  {testResult.output.slice(0, 200)}
                  {testResult.output.length > 200 && "..."}
                </pre>
              )}
              {testResult.error && (
                <p className="text-sm text-destructive">{testResult.error}</p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetState();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          {state === "idle" || state === "error" ? (
            <Button onClick={handleGenerate} disabled={!prompt.trim()}>
              <Sparkles className="size-4 mr-2" />
              Generate
            </Button>
          ) : state === "ready" ? (
            <Button onClick={handleSave}>
              <Save className="size-4 mr-2" />
              Save Tool
            </Button>
          ) : (
            <Button disabled>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Processing...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
