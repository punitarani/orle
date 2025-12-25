"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { runToolTransform } from "./runtime/run-tool-transform";
import type {
  ColorResultData,
  DiffResultData,
  DownloadResultData,
  ImageResultData,
  JsonVisualizerResultData,
  ToolDefinition,
  ToolState,
  ToolTransformInput,
} from "./types";

const DEFAULT_DEBOUNCE_DELAY = 300;

export function useTool(
  tool: ToolDefinition | undefined,
  initialInput?: string,
  initialOptions?: Record<string, unknown>,
) {
  const [persistInputs] = useLocalStorage("orle-persist-inputs", true);
  const [savedInput, setSavedInput] = useLocalStorage(
    `orle-input-${tool?.slug}`,
    "",
  );
  const [savedInput2, setSavedInput2] = useLocalStorage(
    `orle-input2-${tool?.slug}`,
    "",
  );

  const [state, setState] = useState<ToolState>({
    input: "",
    input2: "",
    output: "",
    outputData: undefined,
    download: undefined,
    options: {},
    isProcessing: false,
    error: null,
    file: null,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionsRef = useRef<Record<string, unknown>>({});
  const initializedRef = useRef(false);
  const runIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const downloadUrlRef = useRef<string | null>(null);
  const inputRef = useRef("");
  const input2Ref = useRef("");

  const runPolicy = tool?.runPolicy ?? "auto";
  const debounceMs = tool?.debounceMs ?? DEFAULT_DEBOUNCE_DELAY;

  const buildTransformInput = useCallback(
    (
      inputValue: string,
      input2Value: string,
      fileValue?: File | null,
    ): ToolTransformInput => {
      if (tool?.inputType === "file") {
        return fileValue ?? inputValue;
      }
      if (tool?.acceptsFile && fileValue && !inputValue) {
        return fileValue;
      }
      if (tool?.inputType === "dual") {
        return { kind: "dual", a: inputValue, b: input2Value };
      }
      return inputValue;
    },
    [tool?.acceptsFile, tool?.inputType],
  );

  // Keep optionsRef in sync with state
  useEffect(() => {
    optionsRef.current = state.options;
  }, [state.options]);

  useEffect(() => {
    inputRef.current = state.input;
    input2Ref.current = state.input2 || "";
  }, [state.input, state.input2]);

  useEffect(() => {
    return () => {
      if (downloadUrlRef.current) {
        URL.revokeObjectURL(downloadUrlRef.current);
        downloadUrlRef.current = null;
      }
      abortRef.current?.abort();
    };
  }, []);

  // Transform function - defined early so it can be used in effects
  const transform = useCallback(
    async (input: ToolTransformInput, options: Record<string, unknown>) => {
      if (!tool) return;

      runIdRef.current += 1;
      const runId = runIdRef.current;
      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;

      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        const result = await runToolTransform(
          tool,
          input,
          options,
          abortController.signal,
        );

        if (runId !== runIdRef.current) return;

        if (typeof result === "string") {
          if (downloadUrlRef.current) {
            URL.revokeObjectURL(downloadUrlRef.current);
            downloadUrlRef.current = null;
          }
          setState((prev) => ({
            ...prev,
            output: result,
            outputData: undefined,
            download: undefined,
            isProcessing: false,
          }));
        } else if (result && typeof result === "object") {
          if (result.type === "error") {
            if (downloadUrlRef.current) {
              URL.revokeObjectURL(downloadUrlRef.current);
              downloadUrlRef.current = null;
            }
            setState((prev) => ({
              ...prev,
              error: result.message,
              output: "",
              outputData: undefined,
              download: undefined,
              isProcessing: false,
            }));
          } else if (result.type === "image") {
            if (downloadUrlRef.current) {
              URL.revokeObjectURL(downloadUrlRef.current);
              downloadUrlRef.current = null;
            }
            setState((prev) => ({
              ...prev,
              output: result.data,
              outputData: undefined,
              download: undefined,
              isProcessing: false,
            }));
          } else if (result.type === "download") {
            const data = result as DownloadResultData;
            if (downloadUrlRef.current) {
              URL.revokeObjectURL(downloadUrlRef.current);
            }
            const chunk = new Uint8Array(data.data);
            const blob = new Blob([chunk], { type: data.mime });
            const url = URL.createObjectURL(blob);
            downloadUrlRef.current = url;

            setState((prev) => ({
              ...prev,
              output: "",
              outputData: undefined,
              download: {
                url,
                filename: data.filename,
                mime: data.mime,
                size: blob.size,
              },
              isProcessing: false,
            }));
          } else if (
            result.type === "image-result" ||
            result.type === "color" ||
            result.type === "diff"
          ) {
            // Structured result types
            const data = result as
              | ImageResultData
              | ColorResultData
              | DiffResultData;
            if (downloadUrlRef.current) {
              URL.revokeObjectURL(downloadUrlRef.current);
              downloadUrlRef.current = null;
            }
            setState((prev) => ({
              ...prev,
              output:
                "textOutput" in data
                  ? data.textOutput
                  : "resultUrl" in data
                    ? data.resultUrl
                    : "",
              outputData: data,
              download: undefined,
              isProcessing: false,
            }));
          } else if (result.type === "json-visual") {
            const data = result as JsonVisualizerResultData;
            if (downloadUrlRef.current) {
              URL.revokeObjectURL(downloadUrlRef.current);
              downloadUrlRef.current = null;
            }
            setState((prev) => ({
              ...prev,
              output: data.textOutput,
              outputData: data,
              download: undefined,
              isProcessing: false,
            }));
          } else {
            // Fallback: stringify any other object results
            if (downloadUrlRef.current) {
              URL.revokeObjectURL(downloadUrlRef.current);
              downloadUrlRef.current = null;
            }
            const fallbackOutput = (() => {
              try {
                return JSON.stringify(result, null, 2);
              } catch {
                return String(result);
              }
            })();
            setState((prev) => ({
              ...prev,
              output: fallbackOutput,
              outputData: undefined,
              download: undefined,
              isProcessing: false,
            }));
          }
        }
      } catch (e) {
        if (runId !== runIdRef.current) return;
        if ((e as Error).name === "AbortError") return;
        if (downloadUrlRef.current) {
          URL.revokeObjectURL(downloadUrlRef.current);
          downloadUrlRef.current = null;
        }
        setState((prev) => ({
          ...prev,
          error: (e as Error).message,
          output: "",
          outputData: undefined,
          download: undefined,
          isProcessing: false,
        }));
      }
    },
    [tool],
  );

  // Initialize options from tool defaults, handling initial values from URL
  useEffect(() => {
    if (!tool) return;

    const defaults: Record<string, unknown> = {};
    for (const opt of tool.options || []) {
      defaults[opt.id] = opt.default;
    }

    // Merge defaults with any initial options from URL
    const mergedOptions = initialOptions
      ? { ...defaults, ...initialOptions }
      : defaults;

    // Determine initial input: URL param > saved > empty
    const effectiveInput = initialInput ?? (persistInputs ? savedInput : "");
    const effectiveInput2 = persistInputs ? savedInput2 : "";

    setState((prev) => ({
      ...prev,
      options: mergedOptions,
      input: effectiveInput,
      input2: effectiveInput2,
    }));

    // Auto-run for generator tools OR if initial input was provided via URL
    if (!initializedRef.current) {
      initializedRef.current = true;

      if (runPolicy === "auto" && (tool.inputType === "none" || initialInput)) {
        // Use setTimeout to ensure state is updated
        setTimeout(() => {
          transform(
            buildTransformInput(effectiveInput, effectiveInput2, null),
            mergedOptions,
          );
        }, 0);
      }
    }
  }, [
    tool,
    persistInputs,
    savedInput,
    savedInput2,
    transform,
    initialInput,
    initialOptions,
    runPolicy,
    buildTransformInput,
  ]);

  // Debounced input handler
  const setInput = useCallback(
    (value: string) => {
      setState((prev) => ({ ...prev, input: value }));

      if (persistInputs) {
        setSavedInput(value);
      }

      if (runPolicy !== "auto") return;

      // Debounce transform - use ref to get current options
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        const input2Value = input2Ref.current;
        const nextInput = buildTransformInput(value, input2Value, null);
        transform(nextInput, optionsRef.current);
      }, debounceMs);
    },
    [
      transform,
      persistInputs,
      setSavedInput,
      runPolicy,
      debounceMs,
      buildTransformInput,
    ],
  );

  // Input 2 handler for dual input (diff tools)
  const setInput2 = useCallback(
    (value: string) => {
      setState((prev) => ({ ...prev, input2: value }));

      if (persistInputs) {
        setSavedInput2(value);
      }

      if (runPolicy !== "auto") return;

      // Debounce transform with combined input
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        const inputValue = inputRef.current;
        const nextInput = buildTransformInput(inputValue, value, null);
        transform(nextInput, optionsRef.current);
      }, debounceMs);
    },
    [
      transform,
      persistInputs,
      setSavedInput2,
      runPolicy,
      debounceMs,
      buildTransformInput,
    ],
  );

  // Handle file input
  const setFile = useCallback(
    (file: File) => {
      setState((prev) => ({ ...prev, file }));
      if (runPolicy === "auto") {
        transform(file, optionsRef.current);
      }
    },
    [transform, runPolicy],
  );

  // Handle option change
  const setOption = useCallback(
    (id: string, value: unknown) => {
      setState((prev) => {
        const newOptions = { ...prev.options, [id]: value };
        if (runPolicy === "auto") {
          const nextInput = buildTransformInput(
            prev.input,
            prev.input2 || "",
            prev.file ?? null,
          );
          if (prev.input || prev.file || tool?.inputType === "none") {
            transform(nextInput, newOptions);
          }
        }
        return { ...prev, options: newOptions };
      });
    },
    [transform, tool?.inputType, runPolicy, buildTransformInput],
  );

  // Manual transform trigger
  const runTransform = useCallback(() => {
    const nextInput = buildTransformInput(
      state.input,
      state.input2 || "",
      state.file ?? null,
    );
    if (state.input || state.file || tool?.inputType === "none") {
      transform(nextInput, state.options);
    }
  }, [
    transform,
    state.input,
    state.input2,
    state.file,
    state.options,
    tool?.inputType,
    buildTransformInput,
  ]);

  // Clear all
  const clear = useCallback(() => {
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      input: "",
      input2: "",
      output: "",
      outputData: undefined,
      download: undefined,
      error: null,
      file: null,
    }));
    setSavedInput("");
    setSavedInput2("");
  }, [setSavedInput, setSavedInput2]);

  // Clear file only
  const clearFile = useCallback(() => {
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      file: null,
      output: "",
      outputData: undefined,
      download: undefined,
      error: null,
    }));
  }, []);

  // Swap input/output
  const swap = useCallback(() => {
    if (!tool?.allowSwap) return;
    setState((prev) => ({
      ...prev,
      input: prev.output,
      output: "",
    }));
  }, [tool?.allowSwap]);

  // Load example
  const loadExample = useCallback(
    (example: { input: string }) => {
      setInput(example.input);
    },
    [setInput],
  );

  return {
    ...state,
    setInput,
    setInput2,
    setFile,
    setOption,
    runTransform,
    clear,
    clearFile,
    swap,
    loadExample,
  };
}
