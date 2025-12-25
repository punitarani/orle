import { Buffer } from "node:buffer";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  Action,
  ActionPanel,
  Clipboard,
  Detail,
  Form,
  Icon,
  showToast,
  Toast,
} from "@raycast/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadToolRuntime } from "../runtime/loader";
import type { ToolMeta } from "../runtime/manifest-types";
import type {
  DiffResultData,
  DownloadResultData,
  ImageResultData,
  ToolDefinition,
  ToolOption,
  ToolTransformInput,
} from "../runtime/types";

interface ToolFormProps {
  toolMeta: ToolMeta;
  initialInput?: string;
}

type ResultState =
  | { kind: "text"; text: string }
  | { kind: "diff"; diff: DiffResultData }
  | { kind: "image"; image: ImageResultData | { type: "image"; data: string } }
  | { kind: "download"; info: string; path?: string }
  | null;

type OptionValues = Record<string, unknown>;

export default function ToolForm({
  toolMeta,
  initialInput = "",
}: ToolFormProps) {
  const [tool, setTool] = useState<ToolDefinition | null>(null);
  const [toolLoading, setToolLoading] = useState(true);
  const [input, setInput] = useState(initialInput);
  const [input2, setInput2] = useState("");
  const [options, setOptions] = useState<OptionValues>({});
  const [result, setResult] = useState<ResultState>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const lastCopiedRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const runtime = await loadToolRuntime(toolMeta.slug);
        if (runtime) {
          setTool(runtime);
          const defaults: OptionValues = {};
          for (const opt of runtime.options || []) {
            defaults[opt.id] = opt.default;
          }
          setOptions(defaults);
        } else {
          setError("Tool runtime not available");
        }
      } catch (e) {
        setError(String(e));
      } finally {
        setToolLoading(false);
      }
    })();
  }, [toolMeta.slug]);

  const copyValue = useMemo(() => {
    if (!result) return null;
    switch (result.kind) {
      case "text":
        return result.text;
      case "diff":
        return result.diff.textOutput;
      case "image":
        return result.image?.type === "image-result"
          ? result.image.resultUrl
          : result.image?.data;
      case "download":
        return result.path ?? result.info;
      default:
        return null;
    }
  }, [result]);

  const buildInput = useCallback((): ToolTransformInput => {
    if (!tool) return "";
    switch (tool.inputType) {
      case "dual":
        return { kind: "dual", a: input, b: input2 };
      case "none":
        return { kind: "none" };
      default:
        return input;
    }
  }, [tool, input, input2]);

  const runTransform = useCallback(async () => {
    if (!tool) return;

    setIsRunning(true);
    setError(null);

    try {
      const inputValue = buildInput();
      const output = await tool.transform(inputValue, options);

      if (typeof output === "object" && output !== null && "type" in output) {
        if (output.type === "error") {
          setError(output.message);
          setResult(null);
        } else if (output.type === "diff") {
          setResult({ kind: "diff", diff: output });
        } else if (output.type === "image" || output.type === "image-result") {
          setResult({ kind: "image", image: output });
        } else if (output.type === "download") {
          const saved = await saveDownload(output);
          setResult({
            kind: "download",
            info: saved.info,
            path: saved.path,
          });
        } else {
          setResult({ kind: "text", text: JSON.stringify(output, null, 2) });
        }
      } else {
        setResult({ kind: "text", text: String(output ?? "") });
      }
    } catch (e) {
      setError(String(e));
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  }, [tool, buildInput, options]);

  useEffect(() => {
    if (!tool) return;
    if (tool.inputType === "none" || tool.runPolicy === "auto") {
      const delay = tool.debounceMs ?? 200;
      const timer = setTimeout(() => {
        void runTransform();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [tool, runTransform]);

  useEffect(() => {
    if (
      result &&
      result.kind === "text" &&
      copyValue &&
      copyValue !== lastCopiedRef.current
    ) {
      lastCopiedRef.current = copyValue;
      void Clipboard.copy(copyValue);
      void showToast({
        style: Toast.Style.Success,
        title: "Copied to clipboard",
        message:
          copyValue.length > 40 ? `${copyValue.slice(0, 40)}...` : copyValue,
      });
    }
  }, [result, copyValue]);

  const handleCopy = useCallback(async () => {
    if (!copyValue) return;
    await Clipboard.copy(copyValue);
    await showToast({ style: Toast.Style.Success, title: "Copied" });
  }, [copyValue]);

  const handlePaste = useCallback(async () => {
    if (!copyValue) return;
    await Clipboard.paste(copyValue);
    await showToast({
      style: Toast.Style.Success,
      title: "Pasted to frontmost app",
    });
  }, [copyValue]);

  const handlePasteFromClipboard = useCallback(async () => {
    const text = await Clipboard.readText();
    if (text) setInput(text);
  }, []);

  const handleClear = useCallback(() => {
    setInput("");
    setInput2("");
    setResult(null);
    setError(null);
    lastCopiedRef.current = null;
  }, []);

  if (toolLoading) {
    return <Detail isLoading markdown={`Loading ${toolMeta.name}...`} />;
  }

  if (!tool) {
    return <Detail markdown={`Unable to load tool: ${toolMeta.name}`} />;
  }

  if (tool.inputType === "none") {
    return (
      <GeneratorView
        tool={tool}
        options={options}
        setOptions={setOptions}
        result={result}
        error={error}
        isLoading={isRunning}
        onRun={runTransform}
        onCopy={handleCopy}
        onPaste={handlePaste}
      />
    );
  }

  const visibleOptions =
    tool.options?.filter((opt) => isOptionVisible(opt, options)) ?? [];

  return (
    <Form
      isLoading={isRunning}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action
              title="Run"
              icon={Icon.Play}
              onAction={runTransform}
              shortcut={{ modifiers: ["cmd"], key: "return" }}
            />
            <Action
              title="Paste from Clipboard"
              icon={Icon.Clipboard}
              onAction={handlePasteFromClipboard}
              shortcut={{ modifiers: ["cmd"], key: "v" }}
            />
          </ActionPanel.Section>
          {copyValue && (
            <ActionPanel.Section title="Result">
              <Action
                title="Copy Result"
                icon={Icon.CopyClipboard}
                onAction={handleCopy}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
              <Action
                title="Paste to App"
                icon={Icon.Document}
                onAction={handlePaste}
                shortcut={{ modifiers: ["cmd", "shift"], key: "v" }}
              />
            </ActionPanel.Section>
          )}
          <ActionPanel.Section>
            <Action
              title="Clear"
              icon={Icon.Trash}
              style={Action.Style.Destructive}
              onAction={handleClear}
              shortcut={{ modifiers: ["cmd", "shift"], key: "backspace" }}
            />
            <Action.OpenInBrowser
              title="Open in Orle.dev"
              icon={Icon.Globe}
              url={`https://orle.dev/tools/${tool.slug}${input ? `?input=${encodeURIComponent(Buffer.from(input).toString("base64"))}` : ""}`}
              shortcut={{ modifiers: ["cmd", "shift"], key: "o" }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    >
      <Form.Description title={tool.name} text={tool.description} />

      <Form.TextArea
        id="input"
        title={tool.dualInputConfig?.label1 || "Input"}
        placeholder={tool.inputPlaceholder || "Enter text..."}
        value={input}
        onChange={setInput}
      />

      {tool.inputType === "dual" && (
        <Form.TextArea
          id="input2"
          title={tool.dualInputConfig?.label2 || "Input 2"}
          placeholder={
            tool.dualInputConfig?.placeholder2 || "Enter second text..."
          }
          value={input2}
          onChange={setInput2}
        />
      )}

      {visibleOptions.length > 0 && <Form.Separator />}

      {visibleOptions.map((opt) => (
        <OptionField
          key={opt.id}
          option={opt}
          value={options[opt.id] ?? opt.default}
          onChange={(v) => setOptions((prev) => ({ ...prev, [opt.id]: v }))}
          optionsState={options}
        />
      ))}

      <Form.Separator />

      <ResultField result={result} error={error} />
    </Form>
  );
}

function OptionField({
  option,
  value,
  onChange,
  optionsState,
}: {
  option: ToolOption;
  value: unknown;
  onChange: (value: unknown) => void;
  optionsState: OptionValues;
}) {
  const enabled = isOptionEnabled(option, optionsState);
  const disabledInfo = enabled ? undefined : "Disabled for current selection";
  const guardChange = (next: unknown) => {
    if (!enabled) return;
    onChange(next);
  };

  switch (option.type) {
    case "toggle":
      return (
        <Form.Checkbox
          id={option.id}
          label={option.label}
          value={enabled ? Boolean(value) : false}
          onChange={guardChange}
          info={disabledInfo}
        />
      );
    case "select":
      return (
        <Form.Dropdown
          id={option.id}
          title={option.label}
          value={enabled ? String(value) : ""}
          onChange={guardChange}
          info={disabledInfo}
        >
          {option.options?.map((opt) => (
            <Form.Dropdown.Item
              key={opt.value}
              value={opt.value}
              title={opt.label}
            />
          ))}
        </Form.Dropdown>
      );
    case "number":
      return (
        <Form.TextField
          id={option.id}
          title={option.label}
          value={enabled ? String(value ?? "") : ""}
          onChange={(v) => guardChange(Number(v))}
          info={disabledInfo}
        />
      );
    case "text":
      return (
        <Form.TextField
          id={option.id}
          title={option.label}
          value={enabled ? String(value ?? "") : ""}
          onChange={guardChange}
          info={disabledInfo}
        />
      );
    default:
      return null;
  }
}

function ResultField({
  result,
  error,
}: {
  result: ResultState;
  error: string | null;
}) {
  if (error) {
    return <Form.Description title="Error" text={`❌ ${error}`} />;
  }
  if (!result) {
    return (
      <Form.Description title="Result" text="Run the tool to see output" />
    );
  }

  switch (result.kind) {
    case "text":
      return (
        <Form.TextArea
          id="result"
          title="Result"
          value={result.text}
          onChange={() => {}}
        />
      );
    case "diff": {
      const stats = result.diff.stats;
      const header = stats
        ? `Additions: ${stats.additions}, Deletions: ${stats.deletions}`
        : "Diff";
      return (
        <Form.TextArea
          id="result"
          title={header}
          value={result.diff.textOutput}
          onChange={() => {}}
        />
      );
    }
    case "image": {
      const data =
        result.image?.type === "image-result"
          ? result.image.resultUrl
          : result.image?.data;
      return (
        <Form.Description
          title="Image Result"
          text={
            data
              ? "Image generated. Use Copy to grab the data URL."
              : "Image ready."
          }
        />
      );
    }
    case "download":
      return <Form.Description title="Download" text={result.info} />;
    default:
      return <Form.Description title="Result" text="Ready" />;
  }
}

function isOptionVisible(
  option: ToolOption,
  optionsState: OptionValues,
): boolean {
  if (!option.visibleWhen) return true;
  const current = optionsState[option.visibleWhen.optionId];
  const target = option.visibleWhen.equals;
  return Array.isArray(target)
    ? target.includes(current as never)
    : current === target;
}

function isOptionEnabled(
  option: ToolOption,
  optionsState: OptionValues,
): boolean {
  if (!option.enabledWhen) return true;
  const current = optionsState[option.enabledWhen.optionId];
  const target = option.enabledWhen.equals;
  return Array.isArray(target)
    ? target.includes(current as never)
    : current === target;
}

function GeneratorView({
  tool,
  options,
  setOptions,
  result,
  error,
  isLoading,
  onRun,
  onCopy,
  onPaste,
}: {
  tool: ToolDefinition;
  options: OptionValues;
  setOptions: (opts: OptionValues) => void;
  result: ResultState;
  error: string | null;
  isLoading: boolean;
  onRun: () => void;
  onCopy: () => void;
  onPaste: () => void;
}) {
  if (tool.options && tool.options.length > 0) {
    const visibleOptions = tool.options.filter((opt) =>
      isOptionVisible(opt, options),
    );

    return (
      <Form
        isLoading={isLoading}
        actions={
          <ActionPanel>
            <ActionPanel.Section>
              <Action
                title="Regenerate"
                icon={Icon.ArrowClockwise}
                onAction={onRun}
                shortcut={{ modifiers: ["cmd"], key: "return" }}
              />
            </ActionPanel.Section>
            {result && (
              <ActionPanel.Section title="Result">
                <Action
                  title="Copy"
                  icon={Icon.CopyClipboard}
                  onAction={onCopy}
                  shortcut={{ modifiers: ["cmd"], key: "c" }}
                />
                <Action
                  title="Paste to App"
                  icon={Icon.Document}
                  onAction={onPaste}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "v" }}
                />
              </ActionPanel.Section>
            )}
            <ActionPanel.Section>
              <Action.OpenInBrowser
                title="Open in Orle.dev"
                icon={Icon.Globe}
                url={`https://orle.dev/tools/${tool.slug}`}
              />
            </ActionPanel.Section>
          </ActionPanel>
        }
      >
        <Form.Description title={tool.name} text={tool.description} />

        {visibleOptions.map((opt) => (
          <OptionField
            key={opt.id}
            option={opt}
            value={options[opt.id] ?? opt.default}
            onChange={(v) => setOptions({ ...options, [opt.id]: v })}
            optionsState={options}
          />
        ))}

        <Form.Separator />

        <ResultField result={result} error={error} />
      </Form>
    );
  }

  const markdown = error
    ? `## ❌ Error\n\n${error}`
    : `## ${tool.name}\n\n\`\`\`\n${result && result.kind === "text" ? result.text : "Generating..."}\n\`\`\`\n\n${result ? "✓ *Auto-copied to clipboard*" : ""}`;

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action
              title="Regenerate"
              icon={Icon.ArrowClockwise}
              onAction={onRun}
              shortcut={{ modifiers: ["cmd"], key: "return" }}
            />
          </ActionPanel.Section>
          {result && (
            <ActionPanel.Section title="Result">
              <Action
                title="Copy"
                icon={Icon.CopyClipboard}
                onAction={onCopy}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
              <Action
                title="Paste to App"
                icon={Icon.Document}
                onAction={onPaste}
                shortcut={{ modifiers: ["cmd", "shift"], key: "v" }}
              />
            </ActionPanel.Section>
          )}
          <ActionPanel.Section>
            <Action.OpenInBrowser
              title="Open in Orle.dev"
              icon={Icon.Globe}
              url={`https://orle.dev/tools/${tool.slug}`}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

async function saveDownload(
  result: DownloadResultData,
): Promise<{ info: string; path: string }> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "orle-raycast-"));
  const filePath = path.join(dir, result.filename);
  await fs.writeFile(filePath, Buffer.from(result.data));
  const info = `${result.filename} (${result.mime}, ${result.data.length} bytes)`;
  return { info, path: filePath };
}
