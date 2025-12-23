"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { ToolDefinition, ToolState } from "./types";

const DEBOUNCE_DELAY = 300;

export function useTool(tool: ToolDefinition | undefined) {
  const [persistInputs] = useLocalStorage("orle-persist-inputs", true);
  const [savedInput, setSavedInput] = useLocalStorage(
    `orle-input-${tool?.slug}`,
    "",
  );

  const [state, setState] = useState<ToolState>({
    input: "",
    output: "",
    options: {},
    isProcessing: false,
    error: null,
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
            isProcessing: false,
          }));
        } else if (result && typeof result === "object") {
          if (result.type === "error") {
            setState((prev) => ({
              ...prev,
              error: result.message,
              output: "",
              isProcessing: false,
            }));
          } else if (result.type === "image") {
            setState((prev) => ({
              ...prev,
              output: result.data,
              isProcessing: false,
            }));
          }
        }
      } catch (e) {
        setState((prev) => ({
          ...prev,
          error: (e as Error).message,
          output: "",
          isProcessing: false,
        }));
      }
    },
    [tool],
  );

  // Initialize options from tool defaults
  useEffect(() => {
    if (!tool) return;

    const defaults: Record<string, unknown> = {};
    for (const opt of tool.options || []) {
      defaults[opt.id] = opt.default;
    }

    setState((prev) => ({
      ...prev,
      options: defaults,
      input: persistInputs ? savedInput : "",
    }));

    // Auto-run for generator tools (no input required)
    if (tool.inputType === "none" && !initializedRef.current) {
      initializedRef.current = true;
      // Use setTimeout to ensure state is updated
      setTimeout(() => {
        transform("", defaults);
      }, 0);
    }
  }, [tool, persistInputs, savedInput, transform]);

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

  // Handle file input
  const setFile = useCallback(
    (file: File) => {
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
      output: "",
      error: null,
    }));
    setSavedInput("");
  }, [setSavedInput]);

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
    setFile,
    setOption,
    runTransform,
    clear,
    swap,
    loadExample,
  };
}
