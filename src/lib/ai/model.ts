import { gateway } from "@ai-sdk/gateway";
import { wrapLanguageModel } from "ai";

/**
 * Creates a language model, with DevTools middleware in development only.
 *
 * DevTools captures input parameters, prompts, output content, tool calls,
 * token usage, and timing information for inspection.
 *
 * To view the DevTools dashboard, run: `bun run devtools`
 * This will launch the web UI at http://localhost:4983
 */
export async function createModel(modelId: string) {
  const model = gateway(modelId);

  // Only wrap with DevTools in development
  if (process.env.NODE_ENV === "development") {
    const { devToolsMiddleware } = await import("@ai-sdk/devtools");
    return wrapLanguageModel({
      model,
      middleware: devToolsMiddleware(),
    });
  }

  return model;
}

/**
 * Model IDs for the tool generator
 */
export const GENERATOR_MODEL = "openai/gpt-5.1-codex-mini";
export const VALIDATOR_MODEL = "openai/gpt-5.1-codex-mini";
