/**
 * Web Worker dispatcher for heavy operations.
 * Currently a placeholder - tools run transforms directly.
 * Workers can be added for:
 * - Large file hashing (streaming)
 * - Complex diff operations
 * - Image processing with OffscreenCanvas
 */

export type WorkerType = "hash" | "diff" | "image";

export type WorkerMessage = {
  id: string;
  type: WorkerType;
  payload: unknown;
};

export type WorkerResponse = {
  id: string;
  result?: unknown;
  error?: string;
};

// Map of pending promises
const pending = new Map<
  string,
  { resolve: (value: unknown) => void; reject: (error: Error) => void }
>();

// Worker instances (lazy initialized)
const workers: Partial<Record<WorkerType, Worker>> = {};

function getWorker(type: WorkerType): Worker | null {
  if (typeof window === "undefined") return null;

  if (!workers[type]) {
    try {
      // Workers would be loaded from public/workers/
      // For now, return null to fall back to main thread
      return null;
    } catch {
      console.warn(`Failed to create ${type} worker`);
      return null;
    }
  }

  return workers[type] ?? null;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

/**
 * Run a task in a web worker.
 * Falls back to main thread if workers unavailable.
 */
export async function runInWorker<T>(
  type: WorkerType,
  payload: unknown,
): Promise<T> {
  const worker = getWorker(type);

  if (!worker) {
    // Fall back to main thread execution
    // The actual transform functions handle this case
    throw new Error("Workers not available - use main thread");
  }

  return new Promise((resolve, reject) => {
    const id = generateId();

    pending.set(id, {
      resolve: resolve as (value: unknown) => void,
      reject,
    });

    worker.postMessage({ id, type, payload } satisfies WorkerMessage);

    // Timeout after 30 seconds
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error("Worker timeout"));
      }
    }, 30000);
  });
}

/**
 * Handle worker responses
 */
function handleWorkerMessage(event: MessageEvent<WorkerResponse>) {
  const { id, result, error } = event.data;
  const handler = pending.get(id);

  if (handler) {
    pending.delete(id);
    if (error) {
      handler.reject(new Error(error));
    } else {
      handler.resolve(result);
    }
  }
}

// Set up message handlers when workers are created
function setupWorker(type: WorkerType, worker: Worker) {
  worker.onmessage = handleWorkerMessage;
  worker.onerror = (e) => console.error(`${type} worker error:`, e);
  workers[type] = worker;
}

// Export for potential manual worker setup
export { setupWorker };
