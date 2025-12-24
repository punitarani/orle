import type {
  ToolDefinition,
  ToolTransformInput,
  ToolTransformResult,
} from "../types";

const WORKER_SAFE_TYPES = new Set(["hash", "diff"]);

function supportsWorker(): boolean {
  return typeof window !== "undefined" && typeof Worker !== "undefined";
}

async function runTransformInWorker(
  slug: string,
  input: ToolTransformInput,
  options: Record<string, unknown>,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<ToolTransformResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./transform.worker.ts", import.meta.url),
      { type: "module" },
    );

    let settled = false;

    const cleanup = () => {
      if (settled) return;
      settled = true;
      worker.terminate();
      if (signal) signal.removeEventListener("abort", onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Worker timeout"));
    }, timeoutMs);

    worker.onmessage = (event: MessageEvent<ToolTransformResult>) => {
      clearTimeout(timeoutId);
      cleanup();
      resolve(event.data);
    };

    worker.onerror = (event) => {
      clearTimeout(timeoutId);
      cleanup();
      reject(event.error ?? new Error(event.message));
    };

    if (signal?.aborted) {
      clearTimeout(timeoutId);
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    signal?.addEventListener("abort", onAbort, { once: true });
    worker.postMessage({ slug, input, options });
  });
}

export async function runToolTransform(
  tool: ToolDefinition,
  input: ToolTransformInput,
  options: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<ToolTransformResult> {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  if (
    tool.useWorker &&
    WORKER_SAFE_TYPES.has(tool.useWorker) &&
    supportsWorker()
  ) {
    return runTransformInWorker(tool.slug, input, options, 15000, signal);
  }

  const result = await tool.transform(input, options);
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  return result;
}
