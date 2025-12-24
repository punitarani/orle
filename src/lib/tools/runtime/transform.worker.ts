import { loadToolRuntime } from "../runtime";
import type { ToolTransformInput, ToolTransformResult } from "../types";

type WorkerPayload = {
  slug: string;
  input: ToolTransformInput;
  options: Record<string, unknown>;
};

self.onmessage = async (event: MessageEvent<WorkerPayload>) => {
  const { slug, input, options } = event.data;

  try {
    const tool = await loadToolRuntime(slug);
    if (!tool) {
      const result: ToolTransformResult = {
        type: "error",
        message: "Tool not found",
      };
      self.postMessage(result);
      return;
    }

    const result = await tool.transform(input, options);
    self.postMessage(result);
  } catch (error) {
    const result: ToolTransformResult = {
      type: "error",
      message: (error as Error).message || "Worker transform failed",
    };
    self.postMessage(result);
  }
};
