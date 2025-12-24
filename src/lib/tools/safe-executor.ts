"use client";

import type { ToolTransformResult } from "./types";

/**
 * Maximum execution time for transform functions (in milliseconds)
 */
const MAX_EXECUTION_TIME = 5000;

/**
 * Allowed globals that can be accessed in transform functions
 */
const ALLOWED_GLOBALS = {
  // Primitives and utilities
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

  // Type checking
  isNaN,
  isFinite,
  parseInt,
  parseFloat,

  // Encoding
  encodeURIComponent,
  decodeURIComponent,
  encodeURI,
  decodeURI,
  escape,
  unescape,
  btoa,
  atob,

  // Text encoding
  TextEncoder,
  TextDecoder,

  // Internationalization
  Intl,

  // Crypto (limited)
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

  // Array buffers
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

  // Error types (for creating error responses)
  Error,
  TypeError,
  RangeError,
  SyntaxError,

  // Utilities
  undefined,
  NaN,
  Infinity,

  // Promise for async transforms
  Promise,
};

/**
 * Create a sandboxed execution context for transform functions
 */
function createSandbox(): Record<string, unknown> {
  const sandbox: Record<string, unknown> = { ...ALLOWED_GLOBALS };

  // Create a proxy that blocks access to anything not in the sandbox
  return new Proxy(sandbox, {
    has: () => true, // Pretend we have everything (blocks global lookup)
    get: (target, prop) => {
      if (prop in target) {
        return target[prop as string];
      }
      // Return undefined for anything not allowed
      return undefined;
    },
    set: () => {
      // Allow setting local variables
      return true;
    },
  });
}

/**
 * Execute a transform function in a sandboxed environment
 *
 * @param transformCode - The function body as a string
 * @param input - The input value (string or File)
 * @param options - The options object
 * @returns The transform result
 */
export async function executeTransform(
  transformCode: string,
  input: string | File,
  options: Record<string, unknown>,
): Promise<ToolTransformResult> {
  return new Promise((resolve) => {
    // Set up timeout
    const timeoutId = setTimeout(() => {
      resolve({
        type: "error",
        message: `Transform execution timed out after ${MAX_EXECUTION_TIME / 1000} seconds`,
      });
    }, MAX_EXECUTION_TIME);

    try {
      // Create the sandboxed function
      const sandbox = createSandbox();
      const sandboxKeys = Object.keys(sandbox);
      const sandboxValues = sandboxKeys.map((k) => sandbox[k]);

      // Create function with sandbox variables as parameters
      // This shadows global variables with our safe versions
      const fn = new Function(
        ...sandboxKeys,
        "input",
        "opts",
        `"use strict";
        try {
          ${transformCode}
        } catch (e) {
          return { type: 'error', message: e.message || 'Transform error' };
        }`,
      );

      // Execute the function
      const result = fn(...sandboxValues, input, options);

      // Handle async results
      if (result instanceof Promise) {
        result
          .then((asyncResult) => {
            clearTimeout(timeoutId);
            resolve(normalizeResult(asyncResult));
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            resolve({
              type: "error",
              message: error.message || "Async transform error",
            });
          });
      } else {
        clearTimeout(timeoutId);
        resolve(normalizeResult(result));
      }
    } catch (error) {
      clearTimeout(timeoutId);
      resolve({
        type: "error",
        message: (error as Error).message || "Failed to execute transform",
      });
    }
  });
}

/**
 * Normalize the result to ensure it matches ToolTransformResult type
 */
function normalizeResult(result: unknown): ToolTransformResult {
  if (result === undefined || result === null) {
    return "";
  }

  if (typeof result === "string") {
    return result;
  }

  if (typeof result === "object" && result !== null) {
    const obj = result as Record<string, unknown>;

    // Check for error type
    if (obj.type === "error" && typeof obj.message === "string") {
      return { type: "error", message: obj.message };
    }

    // Check for image type
    if (obj.type === "image" && typeof obj.data === "string") {
      return { type: "image", data: obj.data };
    }

    // Check for image-result type
    if (obj.type === "image-result") {
      return obj as ToolTransformResult;
    }

    // Check for color type
    if (obj.type === "color") {
      return obj as ToolTransformResult;
    }

    // Check for diff type
    if (obj.type === "diff") {
      return obj as ToolTransformResult;
    }
  }

  // Convert anything else to string
  try {
    return String(result);
  } catch {
    return { type: "error", message: "Invalid transform result" };
  }
}

/**
 * Validate transform code before execution (quick syntax check)
 */
export function validateTransformSyntax(transformCode: string): {
  valid: boolean;
  error?: string;
} {
  try {
    new Function("input", "opts", transformCode);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Test a transform with sample input
 */
export async function testTransform(
  transformCode: string,
  testInput: string,
  testOptions: Record<string, unknown>,
): Promise<{
  success: boolean;
  result?: ToolTransformResult;
  error?: string;
  executionTime: number;
}> {
  const startTime = performance.now();

  try {
    const result = await executeTransform(
      transformCode,
      testInput,
      testOptions,
    );
    const executionTime = performance.now() - startTime;

    if (
      typeof result === "object" &&
      result !== null &&
      "type" in result &&
      result.type === "error"
    ) {
      return {
        success: false,
        error: result.message,
        executionTime,
      };
    }

    return {
      success: true,
      result,
      executionTime,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      executionTime: performance.now() - startTime,
    };
  }
}
