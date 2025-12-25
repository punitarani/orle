import type { ToolTransformResult } from "./types";

type WorkerPayload = {
  code: string;
  input: unknown;
  options: Record<string, unknown>;
};

const ALLOWED_GLOBALS = {
  String,
  Number,
  Boolean,
  Array,
  Object,
  Math,
  Date,
  JSON,
  RegExp,
  Map,
  Set,
  Symbol,
  BigInt,
  Proxy,
  Reflect,
  WeakMap,
  WeakSet,
  isNaN,
  isFinite,
  parseInt,
  parseFloat,
  encodeURIComponent,
  decodeURIComponent,
  encodeURI,
  decodeURI,
  escape,
  unescape,
  btoa,
  atob,
  TextEncoder,
  TextDecoder,
  Intl,
  crypto: {
    randomUUID: () => crypto.randomUUID(),
    getRandomValues: (array: Uint8Array): Uint8Array =>
      crypto.getRandomValues(array),
    subtle: {
      digest: (
        algorithm: AlgorithmIdentifier,
        data: BufferSource,
      ): Promise<ArrayBuffer> => crypto.subtle.digest(algorithm, data),
    },
  },
  ArrayBuffer,
  Uint8Array,
  Int8Array,
  Uint16Array,
  Int16Array,
  Uint32Array,
  Int32Array,
  Float32Array,
  Float64Array,
  DataView,
  Error,
  TypeError,
  RangeError,
  SyntaxError,
  structuredClone,
  undefined,
  NaN,
  Infinity,
  Promise,
};

function normalizeResult(result: unknown): ToolTransformResult {
  if (result === undefined || result === null) {
    return "";
  }

  if (typeof result === "string") {
    return result;
  }

  if (typeof result === "object" && result !== null) {
    const obj = result as Record<string, unknown>;

    if (obj.type === "error" && typeof obj.message === "string") {
      return { type: "error", message: obj.message };
    }

    if (obj.type === "image" && typeof obj.data === "string") {
      return { type: "image", data: obj.data };
    }

    if (obj.type === "image-result") {
      return obj as ToolTransformResult;
    }

    if (obj.type === "color") {
      return obj as ToolTransformResult;
    }

    if (obj.type === "diff") {
      return obj as ToolTransformResult;
    }

    if (obj.type === "download") {
      return obj as ToolTransformResult;
    }

    if (obj.type === "json-visual") {
      return obj as ToolTransformResult;
    }

    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return { type: "error", message: "Invalid transform result" };
    }
  }

  try {
    return String(result);
  } catch {
    return { type: "error", message: "Invalid transform result" };
  }
}

self.onmessage = async (event: MessageEvent<WorkerPayload>) => {
  const { code, input, options } = event.data;

  try {
    const sandbox = { ...ALLOWED_GLOBALS };
    const fn = new Function(
      "sandbox",
      "input",
      "opts",
      `
      try {
        with (sandbox) {
          ${code}
        }
      } catch (e) {
        return { type: "error", message: e?.message || "Transform error" };
      }
    `,
    );

    const result = fn(sandbox, input, options);
    if (result instanceof Promise) {
      const asyncResult = await result;
      self.postMessage(normalizeResult(asyncResult));
      return;
    }

    self.postMessage(normalizeResult(result));
  } catch (error) {
    self.postMessage({
      type: "error",
      message: (error as Error).message || "Failed to execute transform",
    } satisfies ToolTransformResult);
  }
};
