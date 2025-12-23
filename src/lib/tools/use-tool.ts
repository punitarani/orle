"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type {
  ColorResultData,
  DiffResultData,
  ImageResultData,
  ToolDefinition,
  ToolState,
} from "./types";

const DEBOUNCE_DELAY = 300;

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
    options: {},
    isProcessing: false,
    error: null,
    file: null,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionsRef = useRef<Record<string, unknown>>({});
  const initializedRef = useRef(false);

  // Keep optionsRef in sync with state
  useEffect(() => {
    optionsRef.current = state.options;
  }, [state.options]);

  // Transform function - defined early so it can be used in effects
  const transform = useCallback(
    async (input: string | File, options: Record<string, unknown>) => {
      if (!tool) return;

      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        const result = await tool.transform(input, options);

        if (typeof result === "string") {
          setState((prev) => ({
            ...prev,
            output: result,
            outputData: undefined,
            isProcessing: false,
          }));
        } else if (result && typeof result === "object") {
          if (result.type === "error") {
            setState((prev) => ({
              ...prev,
              error: result.message,
              output: "",
              outputData: undefined,
              isProcessing: false,
            }));
          } else if (result.type === "image") {
            setState((prev) => ({
              ...prev,
              output: result.data,
              outputData: undefined,
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
            setState((prev) => ({
              ...prev,
              output:
                "textOutput" in data
                  ? data.textOutput
                  : "resultUrl" in data
                    ? data.resultUrl
                    : "",
              outputData: data,
              isProcessing: false,
            }));
          }
        }
      } catch (e) {
        setState((prev) => ({
          ...prev,
          error: (e as Error).message,
          output: "",
          outputData: undefined,
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

      if (tool.inputType === "none" || initialInput) {
        // Use setTimeout to ensure state is updated
        setTimeout(() => {
          transform(effectiveInput, mergedOptions);
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
  ]);

  // Debounced input handler
  const setInput = useCallback(
    (value: string) => {
      setState((prev) => ({ ...prev, input: value }));

      if (persistInputs) {
        setSavedInput(value);
      }

      // Debounce transform - use ref to get current options
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        transform(value, optionsRef.current);
      }, DEBOUNCE_DELAY);
    },
    [transform, persistInputs, setSavedInput],
  );

  // Input 2 handler for dual input (diff tools)
  const setInput2 = useCallback(
    (value: string) => {
      setState((prev) => ({ ...prev, input2: value }));

      if (persistInputs) {
        setSavedInput2(value);
      }

      // Debounce transform with combined input
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        setState((current) => {
          // Combine inputs with separator for transform
          const combined = `${current.input}\n---SEPARATOR---\n${value}`;
          transform(combined, optionsRef.current);
          return current;
        });
      }, DEBOUNCE_DELAY);
    },
    [transform, persistInputs, setSavedInput2],
  );

  // Handle file input
  const setFile = useCallback(
    (file: File) => {
      setState((prev) => ({ ...prev, file }));
      transform(file, state.options);
    },
    [transform, state.options],
  );

  // Handle option change
  const setOption = useCallback(
    (id: string, value: unknown) => {
      setState((prev) => {
        const newOptions = { ...prev.options, [id]: value };
        // Re-transform with new options (for generators too)
        if (prev.input || tool?.inputType === "none") {
          transform(prev.input, newOptions);
        }
        return { ...prev, options: newOptions };
      });
    },
    [transform, tool?.inputType],
  );

  // Manual transform trigger
  const runTransform = useCallback(() => {
    if (state.input || tool?.inputType === "none") {
      transform(state.input, state.options);
    }
  }, [transform, state.input, state.options, tool?.inputType]);

  // Clear all
  const clear = useCallback(() => {
    setState((prev) => ({
      ...prev,
      input: "",
      input2: "",
      output: "",
      outputData: undefined,
      error: null,
      file: null,
    }));
    setSavedInput("");
    setSavedInput2("");
  }, [setSavedInput, setSavedInput2]);

  // Clear file only
  const clearFile = useCallback(() => {
    setState((prev) => ({
      ...prev,
      file: null,
      output: "",
      outputData: undefined,
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
