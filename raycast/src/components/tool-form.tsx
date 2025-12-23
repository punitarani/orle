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
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolMeta, ToolOptionMeta } from "../utils/registry";

interface ToolFormProps {
  tool: ToolMeta;
  initialInput?: string;
}

export default function ToolForm({ tool, initialInput = "" }: ToolFormProps) {
  const [input, setInput] = useState(initialInput);
  const [input2, setInput2] = useState("");
  const [options, setOptions] = useState<Record<string, unknown>>(() => {
    const defaults: Record<string, unknown> = {};
    for (const opt of tool.options || []) {
      defaults[opt.id] = opt.default;
    }
    return defaults;
  });
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const lastCopiedRef = useRef<string | null>(null);

  const runTransform = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let inputValue = input;

      // For dual input tools, combine with separator
      if (tool.inputType === "dual") {
        inputValue = `${input}---SEPARATOR---${input2}`;
      }

      const transformResult = await tool.transform(inputValue, options);

      if (
        typeof transformResult === "object" &&
        transformResult.type === "error"
      ) {
        setError(transformResult.message);
        setResult(null);
      } else {
        setResult(String(transformResult));
        setError(null);
      }
    } catch (e) {
      setError(String(e));
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [tool, input, input2, options]);

  // For generators (no input), run immediately
  useEffect(() => {
    if (tool.inputType === "none") {
      runTransform();
    }
  }, [tool.inputType, runTransform]);

  // Auto-copy result to clipboard when it changes
  useEffect(() => {
    if (result && result !== lastCopiedRef.current) {
      lastCopiedRef.current = result;
      (async () => {
        await Clipboard.copy(result);
        await showToast({
          style: Toast.Style.Success,
          title: "Copied to clipboard",
          message:
            result.length > 40 ? `${result.substring(0, 40)}...` : result,
        });
      })();
    }
  }, [result]);

  const handleCopy = useCallback(async () => {
    if (result) {
      await Clipboard.copy(result);
      await showToast({
        style: Toast.Style.Success,
        title: "Copied to clipboard",
      });
    }
  }, [result]);

  const handlePaste = useCallback(async () => {
    if (result) {
      await Clipboard.paste(result);
      await showToast({
        style: Toast.Style.Success,
        title: "Pasted to frontmost app",
      });
    }
  }, [result]);

  const handlePasteFromClipboard = useCallback(async () => {
    const text = await Clipboard.readText();
    if (text) {
      setInput(text);
    }
  }, []);

  const handleClear = useCallback(() => {
    setInput("");
    setInput2("");
    setResult(null);
    setError(null);
    lastCopiedRef.current = null;
  }, []);

  const updateOption = useCallback((id: string, value: unknown) => {
    setOptions((prev) => ({ ...prev, [id]: value }));
  }, []);

  // If generator, show result view directly
  if (tool.inputType === "none") {
    return (
      <GeneratorView
        tool={tool}
        options={options}
        updateOption={updateOption}
        result={result}
        error={error}
        isLoading={isLoading}
        onRegenerate={runTransform}
        onCopy={handleCopy}
        onPaste={handlePaste}
      />
    );
  }

  // For tools with input, show form
  return (
    <Form
      isLoading={isLoading}
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
          {result && (
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
              title="Open in orle.dev"
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
        title="Input"
        placeholder={tool.inputPlaceholder || "Enter text..."}
        value={input}
        onChange={setInput}
      />

      {tool.inputType === "dual" && (
        <Form.TextArea
          id="input2"
          title="Input 2"
          placeholder="Enter second text for comparison..."
          value={input2}
          onChange={setInput2}
        />
      )}

      {tool.options && tool.options.length > 0 && <Form.Separator />}

      {tool.options?.map((opt) => (
        <OptionField
          key={opt.id}
          option={opt}
          value={options[opt.id]}
          onChange={(v) => updateOption(opt.id, v)}
        />
      ))}

      <Form.Separator />

      {error ? (
        <Form.Description title="Error" text={`❌ ${error}`} />
      ) : result ? (
        <Form.TextArea
          id="result"
          title="Result ✓"
          value={result}
          onChange={() => {}}
          info="Auto-copied to clipboard"
        />
      ) : (
        <Form.Description title="Result" text="Run the tool to see output" />
      )}
    </Form>
  );
}

function OptionField({
  option,
  value,
  onChange,
}: {
  option: ToolOptionMeta;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (option.type) {
    case "toggle":
      return (
        <Form.Checkbox
          id={option.id}
          label={option.label}
          value={Boolean(value)}
          onChange={onChange}
        />
      );
    case "select":
      return (
        <Form.Dropdown
          id={option.id}
          title={option.label}
          value={String(value)}
          onChange={onChange}
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
          value={String(value)}
          onChange={(v) => onChange(Number(v) || option.default)}
        />
      );
    case "text":
      return (
        <Form.TextField
          id={option.id}
          title={option.label}
          value={String(value)}
          onChange={onChange}
        />
      );
    default:
      return null;
  }
}

function GeneratorView({
  tool,
  options,
  updateOption,
  result,
  error,
  isLoading,
  onRegenerate,
  onCopy,
  onPaste,
}: {
  tool: ToolMeta;
  options: Record<string, unknown>;
  updateOption: (id: string, value: unknown) => void;
  result: string | null;
  error: string | null;
  isLoading: boolean;
  onRegenerate: () => void;
  onCopy: () => void;
  onPaste: () => void;
}) {
  // If there are options, show as form for customization
  if (tool.options && tool.options.length > 0) {
    return (
      <Form
        isLoading={isLoading}
        actions={
          <ActionPanel>
            <ActionPanel.Section>
              <Action
                title="Regenerate"
                icon={Icon.ArrowClockwise}
                onAction={onRegenerate}
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
                title="Open in orle.dev"
                icon={Icon.Globe}
                url={`https://orle.dev/tools/${tool.slug}`}
              />
            </ActionPanel.Section>
          </ActionPanel>
        }
      >
        <Form.Description title={tool.name} text={tool.description} />

        {tool.options?.map((opt) => (
          <OptionField
            key={opt.id}
            option={opt}
            value={options[opt.id]}
            onChange={(v) => updateOption(opt.id, v)}
          />
        ))}

        <Form.Separator />

        {error ? (
          <Form.Description title="Error" text={`❌ ${error}`} />
        ) : result ? (
          <Form.TextArea
            id="result"
            title="Result ✓"
            value={result}
            onChange={() => {}}
            info="Auto-copied to clipboard"
          />
        ) : (
          <Form.Description title="Result" text="Generating..." />
        )}
      </Form>
    );
  }

  // Simple generator with no options - show detail view with clean output
  const markdown = error
    ? `## ❌ Error\n\n${error}`
    : `## ${tool.name}\n\n\`\`\`\n${result || "Generating..."}\n\`\`\`\n\n${result ? "✓ *Auto-copied to clipboard*" : ""}`;

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
              onAction={onRegenerate}
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
              title="Open in orle.dev"
              icon={Icon.Globe}
              url={`https://orle.dev/tools/${tool.slug}`}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
      metadata={
        result ? (
          <Detail.Metadata>
            <Detail.Metadata.Label
              title="Length"
              text={`${result.length} chars`}
            />
            <Detail.Metadata.Separator />
            <Detail.Metadata.Link
              title="orle.dev"
              text={tool.name}
              target={`https://orle.dev/tools/${tool.slug}`}
            />
          </Detail.Metadata>
        ) : undefined
      }
    />
  );
}

function _ResultView({
  tool,
  result,
  onCopy,
  onPaste,
}: {
  tool: ToolMeta;
  result: string;
  onCopy: () => void;
  onPaste: () => void;
}) {
  const markdown = `## ${tool.name}\n\n\`\`\`\n${result}\n\`\`\``;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
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
          <ActionPanel.Section>
            <Action.OpenInBrowser
              title="Open in orle.dev"
              icon={Icon.Globe}
              url={`https://orle.dev/tools/${tool.slug}`}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label
            title="Length"
            text={`${result.length} chars`}
          />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Link
            title="orle.dev"
            text={tool.name}
            target={`https://orle.dev/tools/${tool.slug}`}
          />
        </Detail.Metadata>
      }
    />
  );
}
