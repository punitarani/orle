"use client";

import type { ToolTransformResult } from "./types";

const MAX_EXECUTION_TIME = 5000;

export async function executeTransform(
  transformCode: string,
  input: unknown,
  options: Record<string, unknown>,
): Promise<ToolTransformResult> {
  return new Promise((resolve) => {
    const worker = new Worker(
      new URL("./safe-executor.worker.ts", import.meta.url),
      { type: "module" },
    );

    const timeoutId = setTimeout(() => {
      worker.terminate();
      resolve({
        type: "error",
        message: `Transform execution timed out after ${MAX_EXECUTION_TIME / 1000} seconds`,
      });
    }, MAX_EXECUTION_TIME);

    worker.onmessage = (event: MessageEvent<ToolTransformResult>) => {
      clearTimeout(timeoutId);
      worker.terminate();
      resolve(event.data);
    };

    worker.onerror = (event) => {
      clearTimeout(timeoutId);
      worker.terminate();
      resolve({
        type: "error",
        message: event.message || "Failed to execute transform",
      });
    };

    worker.postMessage({ code: transformCode, input, options });
  });
}
