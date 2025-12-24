import { devToolsMiddleware } from "@ai-sdk/devtools";
import { gateway } from "@ai-sdk/gateway";
import { wrapLanguageModel } from "ai";

/**
 * Creates a language model wrapped with DevTools middleware for debugging.
 *
 * DevTools captures input parameters, prompts, output content, tool calls,
 * token usage, and timing information for inspection.
 *
 * To view the DevTools dashboard, run: `npx @ai-sdk/devtools`
 * This will launch the web UI at http://localhost:4983
 */
export function createDevToolsModel(modelId: string) {
  return wrapLanguageModel({
    model: gateway(modelId),
    middleware: devToolsMiddleware(),
  });
}

/**
 * Model IDs for the tool generator
 */
export const GENERATOR_MODEL = "openai/gpt-5.1-codex-mini";
export const VALIDATOR_MODEL = "openai/gpt-5.1-codex-mini";
