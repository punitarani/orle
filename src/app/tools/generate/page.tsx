"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  Loader2,
  Play,
  RefreshCcw,
  RotateCcw,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";
import { nanoid } from "nanoid";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputCharacterCount,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { ToolExecutionCard } from "@/components/tools/tool-execution-card";
import { ToolInput } from "@/components/tools/tool-input";
import { ToolOptions } from "@/components/tools/tool-options";
import { ToolOutput } from "@/components/tools/tool-output";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClipboard } from "@/hooks/use-clipboard";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  generateUniqueSlug,
  saveCustomTool,
} from "@/lib/tools/custom-tools-db";
import { getToolMetaBySlug } from "@/lib/tools/manifest";
import { executeTransform } from "@/lib/tools/safe-executor";
import type {
  CustomToolDefinition,
  CustomToolDefinitionGenerated,
  ToolOption,
} from "@/lib/tools/types";
import { cn } from "@/lib/utils";

// Component to render a tool preview card
function ToolPreviewCard({
  tool,
  onTest,
  isTesting,
}: {
  tool: CustomToolDefinitionGenerated;
  onTest: () => void;
  isTesting: boolean;
}) {
  const { copy } = useClipboard();

  return (
    <Card className="border-primary/20 bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wand2 className="size-4 text-primary" />
              {tool.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{tool.description}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 font-mono text-xs">
            {tool.slug}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {tool.inputType} input
          </Badge>
          <Badge variant="outline" className="text-xs">
            {tool.outputType} output
          </Badge>
          {tool.options && tool.options.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {tool.options.length} option{tool.options.length > 1 ? "s" : ""}
            </Badge>
          )}
          {tool.allowSwap && (
            <Badge variant="outline" className="text-xs">
              swappable
            </Badge>
          )}
        </div>

        {tool.aliases && tool.aliases.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tool.aliases.map((alias) => (
              <span
                key={alias}
                className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono"
              >
                {alias}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onTest}
            disabled={isTesting || tool.inputType === "file"}
          >
            {isTesting ? (
              <Loader2 className="size-3.5 mr-1.5 animate-spin" />
            ) : (
              <Play className="size-3.5 mr-1.5" />
            )}
            Test
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copy(JSON.stringify(tool, null, 2))}
          >
            <Copy className="size-3.5 mr-1.5" />
            Copy JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Component to render existing tool redirect suggestion
function ToolRedirectCard({
  slug,
  reason,
  relatedTools,
  onGenerateAnyway,
}: {
  slug: string;
  reason: string;
  relatedTools?: string[];
  onGenerateAnyway: () => void;
}) {
  const router = useRouter();
  const toolMeta = getToolMetaBySlug(slug);

  if (!toolMeta) {
    return null;
  }

  const handleGoToTool = () => {
    router.push(`/tools/${slug}`);
  };

  const relatedToolsMeta = relatedTools
    ?.map((s) => getToolMetaBySlug(s))
    .filter((meta): meta is NonNullable<typeof meta> => Boolean(meta))
    .slice(0, 3);

  return (
    <Card className="border-green-500/30 bg-green-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="mt-1 rounded-full bg-green-500/10 p-2">
            <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg">Existing Tool Found</CardTitle>
            <p className="text-sm text-muted-foreground">
              This tool already exists in orle.dev
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold">{toolMeta.name}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {toolMeta.description}
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {toolMeta.section}
            </Badge>
          </div>

          {toolMeta.aliases && toolMeta.aliases.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {toolMeta.aliases.slice(0, 3).map((alias) => (
                <span
                  key={alias}
                  className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono"
                >
                  {alias}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-sm">
            <span className="font-medium">Match reason:</span> {reason}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleGoToTool} className="flex-1">
            <ExternalLink className="size-4 mr-2" />
            Go to Tool
          </Button>
          <Button
            variant="outline"
            onClick={onGenerateAnyway}
            className="flex-1"
          >
            Generate Custom Tool Anyway
          </Button>
        </div>

        {relatedToolsMeta && relatedToolsMeta.length > 0 && (
          <div className="pt-2 border-t space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Related tools you might find useful:
            </p>
            <div className="flex flex-wrap gap-2">
              {relatedToolsMeta.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  {tool.name}
                  <ArrowRight className="size-3" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component to render validation results
function ValidationResult({
  valid,
  issues,
  securityConcerns,
  suggestions,
}: {
  valid: boolean;
  issues?: string[];
  securityConcerns?: string[] | null;
  suggestions?: string[] | null;
}) {
  if (valid) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
        <CheckCircle2 className="size-5 text-green-500 shrink-0" />
        <div>
          <p className="font-medium text-green-700 dark:text-green-400">
            Validation Passed
          </p>
          <p className="text-sm text-green-600/80 dark:text-green-400/80">
            Tool is ready to save and use
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 space-y-3">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="size-5 shrink-0" />
        <span className="font-medium">Validation Failed</span>
      </div>

      {issues && issues.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Issues
          </p>
          <ul className="text-sm space-y-1">
            {issues.map((issue) => (
              <li key={issue} className="text-muted-foreground flex gap-2">
                <span className="text-destructive">•</span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {securityConcerns && securityConcerns.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-destructive uppercase tracking-wide">
            Security Concerns
          </p>
          <ul className="text-sm space-y-1">
            {securityConcerns.map((concern) => (
              <li key={concern} className="text-destructive flex gap-2">
                <span>•</span>
                {concern}
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Suggestions
          </p>
          <ul className="text-sm space-y-1">
            {suggestions.map((suggestion) => (
              <li key={suggestion} className="text-muted-foreground flex gap-2">
                <span className="text-primary">→</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Code viewer component
function CodeViewer({ code, title }: { code: string; title: string }) {
  const { copy } = useClipboard();

  return (
    <div className="rounded-lg border bg-muted/30 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Code2 className="size-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {title}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => copy(code)}
        >
          <Copy className="size-3 mr-1" />
          Copy
        </Button>
      </div>
      <pre className="p-3 text-xs overflow-x-auto font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Filter out redundant progress update messages
const PROGRESS_PATTERNS = [
  /^searching existing tools/i,
  /^generating tool definition/i,
  /^validating tool/i,
  /^testing runtime/i,
  /^✓ tool ready/i,
  /^understood\..*generating custom/i,
  /^tool executed successfully/i,
  /^i'll search/i,
  /^let me/i,
  /^now let me/i,
];

function shouldShowTextMessage(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return !PROGRESS_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export default function ToolGeneratePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const promptSeed = searchParams.get("prompt") ?? "";
  const isMobile = useIsMobile();
  const [lastValidTool, setLastValidTool] =
    useState<CustomToolDefinitionGenerated | null>(null);
  const [saving, setSaving] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState("");
  const [testError, setTestError] = useState<string | undefined>(undefined);
  const [isTesting, setIsTesting] = useState(false);
  const [testOptions, setTestOptions] = useState<Record<string, unknown>>({});
  const [activeTab, setActiveTab] = useState<"agent" | "tool">("agent");
  const [toolPanelTab, setToolPanelTab] = useState<"test" | "code">("test");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/tools/agent",
      }),
    [],
  );

  const { messages, sendMessage, status, setMessages, error } = useChat({
    transport,
  });

  const visibleMessages = useMemo(
    () => messages.filter((m) => m.role !== "system"),
    [messages],
  );

  const lastUserText = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role !== "user") continue;
      for (let j = m.parts.length - 1; j >= 0; j--) {
        const part = m.parts[j];
        if (part.type === "text" && part.text.trim()) return part.text;
      }
    }
    return null;
  }, [messages]);

  const handleRetry = useCallback(async () => {
    if (!lastUserText) return;

    // Remove the failed assistant message AND the last user message
    // Find the last user message index
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserIndex = i;
        break;
      }
    }

    // Remove everything from the last user message onwards
    // This includes the user message and any failed assistant responses
    if (lastUserIndex !== -1) {
      const cleanMessages = messages.slice(0, lastUserIndex);
      setMessages(cleanMessages);

      // Wait for state to update before sending
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Now retry - sendMessage will create a fresh user message
    await sendMessage({ text: lastUserText });
  }, [lastUserText, sendMessage, messages, setMessages]);

  const handleReset = useCallback(() => {
    setMessages([]);
    setLastValidTool(null);
    setTestInput("");
    setTestOutput("");
    setTestError(undefined);
    setTestOptions({});
    setActiveTab("agent");
    setToolPanelTab("test");
  }, [setMessages]);

  const handleSave = async () => {
    if (!lastValidTool) return;

    setSaving(true);
    try {
      const uniqueSlug = await generateUniqueSlug(lastValidTool.slug);
      const fullTool: CustomToolDefinition = {
        ...lastValidTool,
        slug: uniqueSlug,
        id: nanoid(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isCustom: true,
      };

      await saveCustomTool(fullTool);
      router.push(`/tools/custom/${fullTool.id}`);
    } catch (e) {
      console.error("Failed to save tool:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (toolOverride?: CustomToolDefinitionGenerated) => {
    const toolToTest = toolOverride ?? lastValidTool;
    if (!toolToTest) return;

    setIsTesting(true);
    setTestOutput("");
    setTestError(undefined);

    try {
      // Build options from defaults merged with user selections
      const mergedOptions: Record<string, unknown> = {};
      if (toolToTest.options) {
        for (const opt of toolToTest.options) {
          mergedOptions[opt.id] = testOptions[opt.id] ?? opt.default;
        }
      }

      const result = await executeTransform(
        toolToTest.transformCode,
        testInput,
        mergedOptions,
      );

      if (typeof result === "string") {
        setTestOutput(result);
      } else if (result && typeof result === "object" && "type" in result) {
        if (result.type === "error") {
          setTestError(result.message as string);
        } else {
          setTestOutput(JSON.stringify(result, null, 2));
        }
      }
    } catch (e) {
      setTestError((e as Error).message);
    } finally {
      setIsTesting(false);
    }
  };

  // Initialize options when tool changes
  useEffect(() => {
    if (lastValidTool?.options) {
      const defaults: Record<string, unknown> = {};
      for (const opt of lastValidTool.options) {
        defaults[opt.id] = opt.default;
      }
      setTestOptions(defaults);
    }
  }, [lastValidTool]);

  // Extract tool and validation info from messages
  // NOTE: This function must NOT call setState - it's called during render!
  // Wrapped in useCallback to be usable in useEffect dependencies
  type MessageParts = (typeof messages)[0]["parts"];
  const extractToolInfo = useCallback(
    (
      parts: MessageParts,
    ): {
      tool: CustomToolDefinitionGenerated | null;
      validation: {
        valid: boolean;
        issues?: string[];
        securityConcerns?: string[] | null;
        suggestions?: string[] | null;
      } | null;
      redirect: {
        slug: string;
        reason: string;
        relatedTools?: string[];
      } | null;
    } => {
      let tool: CustomToolDefinitionGenerated | null = null;
      let validation: {
        valid: boolean;
        issues?: string[];
        securityConcerns?: string[] | null;
        suggestions?: string[] | null;
      } | null = null;
      let redirect: {
        slug: string;
        reason: string;
        relatedTools?: string[];
      } | null = null;

      for (const part of parts) {
        if (part.type.startsWith("tool-")) {
          const toolPart = part as unknown as {
            type: string;
            toolCallId: string;
            state: string;
            input?: unknown;
            output?: unknown;
          };

          const toolName = part.type.replace("tool-", "");

          // Check for redirect suggestions
          if (
            toolName === "suggestExistingTool" &&
            toolPart.state === "output-available" &&
            toolPart.output
          ) {
            const result = toolPart.output as {
              type?: string;
              slug?: string;
              reason?: string;
              relatedTools?: string[];
            };
            if (result.type === "redirect" && result.slug && result.reason) {
              redirect = {
                slug: result.slug,
                reason: result.reason,
                relatedTools: result.relatedTools,
              };
            }
          }

          // Check for completed tool calls (state is 'output-available')
          if (
            toolName === "generateToolDefinition" &&
            toolPart.state === "output-available" &&
            toolPart.output
          ) {
            const result = toolPart.output as {
              tool?: CustomToolDefinitionGenerated;
            };
            if (result.tool) {
              tool = result.tool;
            }
          }

          if (
            toolName === "validateToolDefinition" &&
            toolPart.state === "output-available" &&
            toolPart.output
          ) {
            const result = toolPart.output as {
              valid: boolean;
              issues?: string[];
              securityConcerns?: string[] | null;
              suggestions?: string[] | null;
              tool?: CustomToolDefinitionGenerated;
            };
            validation = {
              valid: result.valid,
              issues: result.issues,
              securityConcerns: result.securityConcerns,
              suggestions: result.suggestions,
            };
            if (result.valid && result.tool) {
              tool = result.tool;
              // NOTE: Do NOT call setLastValidTool here - this function is called during render!
              // We use a useEffect below to update lastValidTool when a valid tool is found.
            }
          }
        }
      }

      return { tool, validation, redirect };
    },
    [],
  );

  // Get the latest tool from all messages
  const getLatestTool = (): CustomToolDefinitionGenerated | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const { tool } = extractToolInfo(messages[i].parts);
      if (tool) return tool;
    }
    return lastValidTool;
  };

  const latestTool = getLatestTool();

  // Use useEffect to update lastValidTool when we find a validated tool
  // This prevents calling setState during render which causes infinite loops
  useEffect(() => {
    // Scan messages for validated tools
    for (let i = messages.length - 1; i >= 0; i--) {
      const { validation, tool } = extractToolInfo(messages[i].parts);
      if (validation?.valid && tool) {
        setLastValidTool(tool);
        break;
      }
    }
  }, [messages, extractToolInfo]);

  return (
    <div className="flex flex-col -m-6 h-[calc(100vh-3.5rem)] overflow-x-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 shrink-0 bg-background">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h1 className="min-w-0 truncate text-sm font-medium">
            Generate Custom Tool
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="size-3.5 mr-1.5" />
              Reset
            </Button>
          )}
          {lastValidTool && (
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-3.5 mr-1.5" />
                  Save
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Tab Selector */}
      {isMobile && latestTool && (
        <div className="border-b px-4 py-2 bg-background shrink-0">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "agent" | "tool")}
          >
            {/* TabsList defaults to inline-flex + w-fit, so force grid/full-width on mobile */}
            <TabsList className="!grid !w-full grid-cols-2">
              <TabsTrigger value="agent">Agent</TabsTrigger>
              <TabsTrigger value="tool">Tool</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Chat Column */}
        <div
          className={cn(
            "flex flex-1 flex-col border-r min-h-0",
            isMobile && activeTab !== "agent" && "hidden",
          )}
        >
          {/* Empty State - No scroll, centered content */}
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Sparkles className="size-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">
                Create a Custom Tool
              </h2>
              <p className="text-muted-foreground max-w-md mb-8">
                Describe what you want your tool to do. The AI will generate,
                validate, and iterate until you're satisfied.
              </p>
              <div className="grid gap-3 text-left max-w-md w-full">
                <button
                  type="button"
                  className="p-3 rounded-lg border bg-card hover:bg-accent text-left transition-colors"
                  onClick={() =>
                    sendMessage({
                      text: "Create a tool that converts CSV text to JSON format with options for header row and delimiter",
                    })
                  }
                >
                  <p className="font-medium text-sm">CSV to JSON Converter</p>
                  <p className="text-xs text-muted-foreground">
                    Convert CSV data with configurable options
                  </p>
                </button>
                <button
                  type="button"
                  className="p-3 rounded-lg border bg-card hover:bg-accent text-left transition-colors"
                  onClick={() =>
                    sendMessage({
                      text: "Create a password generator with options for length, uppercase, lowercase, numbers, and special characters",
                    })
                  }
                >
                  <p className="font-medium text-sm">Password Generator</p>
                  <p className="text-xs text-muted-foreground">
                    Generate secure passwords with custom rules
                  </p>
                </button>
                <button
                  type="button"
                  className="p-3 rounded-lg border bg-card hover:bg-accent text-left transition-colors"
                  onClick={() =>
                    sendMessage({
                      text: "Create a word counter that shows character count, word count, sentence count, and reading time",
                    })
                  }
                >
                  <p className="font-medium text-sm">Word Counter</p>
                  <p className="text-xs text-muted-foreground">
                    Analyze text statistics and reading time
                  </p>
                </button>
              </div>
            </div>
          ) : (
            /* Conversation with messages - scrollable only when content overflows */
            <Conversation className="flex-1">
              <ConversationContent className="max-w-3xl mx-auto p-4 sm:p-6">
                {visibleMessages.map((message, messageIndex) => {
                  const { tool, validation, redirect } = extractToolInfo(
                    message.parts,
                  );
                  const role = message.role as "user" | "assistant";

                  // Check for in-progress tool calls
                  const pendingToolCalls = message.parts.filter(
                    (p) =>
                      p.type.startsWith("tool-") &&
                      "state" in p &&
                      (p.state === "input-streaming" ||
                        p.state === "input-available"),
                  );

                  const turnText = message.parts
                    .filter((p) => p.type === "text")
                    .map((p) => p.text)
                    .join("\n\n");

                  const isLastVisibleMessage =
                    messageIndex === visibleMessages.length - 1;

                  return (
                    <div key={message.id} className="space-y-2">
                      {/* Render tool execution cards */}
                      {message.parts
                        .filter((p) => p.type === "tool-call")
                        .map((toolPart, toolIdx) => {
                          // Type guard: we filtered for tool-call type above
                          if (
                            toolPart.type === "tool-call" &&
                            "toolName" in toolPart &&
                            "args" in toolPart &&
                            typeof toolPart.toolName === "string" &&
                            typeof toolPart.args === "object" &&
                            toolPart.args !== null
                          ) {
                            const toolName = toolPart.toolName;
                            const args = toolPart.args as Record<
                              string,
                              unknown
                            >;
                            const toolCallId = toolPart.toolCallId;

                            // Find the corresponding tool result
                            const toolResult = message.parts.find(
                              (p) =>
                                p.type === "tool-result" &&
                                "toolCallId" in p &&
                                p.toolCallId === toolCallId,
                            );

                            const result =
                              toolResult && "result" in toolResult
                                ? (toolResult.result as string | object)
                                : undefined;

                            return (
                              <ToolExecutionCard
                                key={`tool-${message.id}-${toolIdx}`}
                                name={toolName}
                                status={
                                  result !== undefined
                                    ? "output-available"
                                    : "input-available"
                                }
                                parameters={args}
                                result={result}
                              />
                            );
                          }
                          return null;
                        })}

                      {/* Render each text part as its own bubble (matches AI SDK recommended pattern) */}
                      {message.parts
                        .filter((p) => p.type === "text")
                        .map((part, i) => {
                          const textPart = part as {
                            type: "text";
                            text: string;
                          };

                          // Filter out progress messages
                          if (!shouldShowTextMessage(textPart.text)) {
                            return null;
                          }

                          return (
                            <Message key={`${message.id}-${i}`} from={role}>
                              <MessageContent from={role}>
                                <MessageResponse parseIncompleteMarkdown>
                                  {textPart.text}
                                </MessageResponse>
                              </MessageContent>
                            </Message>
                          );
                        })}

                      {redirect && role === "assistant" && (
                        <div className="mt-2">
                          <ToolRedirectCard
                            slug={redirect.slug}
                            reason={redirect.reason}
                            relatedTools={redirect.relatedTools}
                            onGenerateAnyway={() => {
                              // Remove redirect message and continue generation
                              const lastUserIndex = messages.findIndex(
                                (m, idx) =>
                                  idx < messageIndex && m.role === "user",
                              );
                              if (lastUserIndex !== -1) {
                                const userMsg = messages[lastUserIndex];
                                const userText = userMsg.parts
                                  .filter((p) => p.type === "text")
                                  .map(
                                    (p) =>
                                      (p as { type: "text"; text: string })
                                        .text,
                                  )
                                  .join(" ");

                                // Reset and ask to generate anyway
                                setMessages([]);
                                setTimeout(() => {
                                  sendMessage({
                                    text: `${userText}\n\nNote: I want to generate a custom tool anyway, not use the existing tool.`,
                                  });
                                }, 100);
                              }
                            }}
                          />
                        </div>
                      )}

                      {tool && role === "assistant" && !redirect && (
                        <div className="mt-2">
                          <ToolPreviewCard
                            tool={tool}
                            onTest={() => {
                              if (isMobile) setActiveTab("tool");
                              setToolPanelTab("test");
                              setLastValidTool(tool);
                              handleTest(tool);
                            }}
                            isTesting={isTesting}
                          />
                        </div>
                      )}

                      {/* Show validating spinner below the tool card */}
                      {pendingToolCalls.length > 0 &&
                        role === "assistant" &&
                        !validation && (
                          <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" />
                            <span className="text-sm">
                              {pendingToolCalls.some((p) =>
                                p.type.includes("generate"),
                              )
                                ? "Generating tool definition..."
                                : "Validating tool..."}
                            </span>
                          </div>
                        )}

                      {validation && role === "assistant" && (
                        <div className="mt-2">
                          <ValidationResult
                            valid={validation.valid}
                            issues={validation.issues}
                            securityConcerns={validation.securityConcerns}
                            suggestions={validation.suggestions}
                          />
                        </div>
                      )}

                      {/* Actions: only once, at the bottom of the entire conversation turn */}
                      {role === "assistant" && isLastVisibleMessage && (
                        <MessageActions className="mt-1">
                          <MessageAction
                            tooltip="Retry"
                            label="Retry"
                            onClick={handleRetry}
                            disabled={!lastUserText || status === "streaming"}
                          >
                            <RefreshCcw className="size-3" />
                          </MessageAction>
                          <MessageAction
                            tooltip="Copy"
                            label="Copy"
                            onClick={() =>
                              navigator.clipboard.writeText(turnText)
                            }
                            disabled={!turnText.trim()}
                          >
                            <Copy className="size-3" />
                          </MessageAction>
                        </MessageActions>
                      )}
                    </div>
                  );
                })}

                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 space-y-3">
                    <div className="text-destructive">
                      <p className="font-medium">Something went wrong</p>
                      <p className="text-sm opacity-90">
                        The model returned an invalid tool call while streaming.
                        You can retry safely.
                      </p>
                      <p className="text-xs opacity-70 mt-1">{error.message}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        disabled={!lastUserText || status === "streaming"}
                      >
                        <RefreshCcw className="size-3.5 mr-1.5" />
                        Retry
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleReset}>
                        <RotateCcw className="size-3.5 mr-1.5" />
                        Reset
                      </Button>
                    </div>
                  </div>
                )}
              </ConversationContent>
              <ConversationScrollButton className="bottom-6 safe-bottom" />
            </Conversation>
          )}

          {/* Input Area */}
          <div className="border-t p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-[calc(1rem+env(safe-area-inset-bottom))] shrink-0">
            <div className="max-w-3xl mx-auto">
              <PromptInput
                onSubmit={async (msg) => {
                  if (msg.text.trim() && msg.text.length <= 1000) {
                    await sendMessage({ text: msg.text });
                  }
                }}
                disabled={status === "streaming"}
                maxLength={1000}
                showCharacterCount="near-limit"
                initialValue={promptSeed}
              >
                <PromptInputTextarea
                  placeholder={
                    messages.length === 0
                      ? "Describe the tool you want to create..."
                      : "Ask for changes, improvements, or create a new tool..."
                  }
                  // In-field submit button lives at bottom-right
                  className="min-h-[60px] pr-12"
                />
                <PromptInputSubmit
                  status={status === "streaming" ? "streaming" : "ready"}
                  className="absolute bottom-2 right-2"
                />
                <PromptInputCharacterCount className="self-end pr-12" />
              </PromptInput>
            </div>
          </div>
        </div>

        {/* Preview/Test Panel */}
        {latestTool && (
          <div
            className={cn(
              "shrink-0 flex flex-col overflow-hidden",
              isMobile ? (activeTab === "tool" ? "w-full" : "hidden") : "w-96",
            )}
          >
            <Tabs
              value={toolPanelTab}
              onValueChange={(v) => setToolPanelTab(v as "test" | "code")}
              className="flex flex-col h-full"
            >
              <div className="px-4 pt-4 shrink-0 flex justify-end">
                {/* Compact tabs aligned to the right */}
                <TabsList>
                  <TabsTrigger value="test">Test</TabsTrigger>
                  <TabsTrigger value="code">Code</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="test"
                className="flex-1 overflow-auto p-4 space-y-4 m-0"
              >
                {/* Options - matching tool page */}
                {latestTool.options && latestTool.options.length > 0 && (
                  <ToolOptions
                    options={latestTool.options as ToolOption[]}
                    values={testOptions}
                    onChange={(id, value) =>
                      setTestOptions((prev) => ({ ...prev, [id]: value }))
                    }
                  />
                )}

                {/* Input - matching tool page for non-none input types */}
                {latestTool.inputType !== "none" && (
                  <div className="space-y-2">
                    <div className="flex h-7 items-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        Input
                      </span>
                    </div>
                    <ToolInput
                      type={
                        latestTool.inputType === "dual"
                          ? "text"
                          : latestTool.inputType
                      }
                      value={testInput}
                      onChange={setTestInput}
                      placeholder={latestTool.inputPlaceholder ?? undefined}
                      className="min-h-[120px]"
                    />
                    <Button
                      onClick={() => handleTest()}
                      disabled={!testInput || isTesting}
                      className="self-end"
                    >
                      <Play className="mr-2 size-4" />
                      {isTesting ? "Running..." : "Run"}
                    </Button>
                  </div>
                )}

                {/* Generator tools (no input) - matching tool page */}
                {latestTool.inputType === "none" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Output
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTest()}
                        className="h-8"
                      >
                        <Play className="mr-2 size-3.5" />
                        {isTesting ? "Generating..." : "Generate"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Output - matching tool page */}
                {latestTool.inputType !== "none" && (
                  <div className="space-y-2">
                    <div className="flex h-7 items-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        Output
                      </span>
                    </div>
                    <ToolOutput
                      type={latestTool.outputType}
                      value={testOutput}
                      error={testError}
                      isProcessing={isTesting}
                      placeholder={latestTool.outputPlaceholder ?? undefined}
                      className="min-h-[120px]"
                    />
                  </div>
                )}

                {/* Output for generator tools */}
                {latestTool.inputType === "none" && (
                  <ToolOutput
                    type={latestTool.outputType}
                    value={testOutput}
                    error={testError}
                    isProcessing={isTesting}
                    placeholder={latestTool.outputPlaceholder ?? undefined}
                  />
                )}
              </TabsContent>

              <TabsContent
                value="code"
                className="flex-1 overflow-auto p-4 space-y-4 m-0"
              >
                <CodeViewer
                  code={latestTool.transformCode}
                  title="Transform Code"
                />

                {latestTool.options && latestTool.options.length > 0 && (
                  <CodeViewer
                    code={JSON.stringify(latestTool.options, null, 2)}
                    title="Options Schema"
                  />
                )}

                <CodeViewer
                  code={JSON.stringify(latestTool, null, 2)}
                  title="Full Definition"
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
