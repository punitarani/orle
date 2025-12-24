import { gateway } from "@ai-sdk/gateway";
import { wrapLanguageModel } from "ai";

export type ModelConfig = {
  /**
   * Gateway model identifier (string).
   *
   * Examples:
   * - "openai/gpt-5.1-codex-mini"
   * - "zai/glm-4.6"
   * - "gpt-5.1" (if supported by your gateway configuration)
   */
  model: string;
  /**
   * Provider-specific options that should be passed to `streamText` / `generateText`
   * as the top-level `providerOptions` param.
   *
   * NOTE: These options are NOT applied by the gateway model instance itself.
   */
  providerOptions?: {
    gateway?: {
      order?: string[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
};

/**
 * Creates a language model, with DevTools middleware in development only.
 *
 * DevTools captures input parameters, prompts, output content, tool calls,
 * token usage, and timing information for inspection.
 *
 * To view the DevTools dashboard, run: `bun run devtools`
 * This will launch the web UI at http://localhost:4983
 */
export async function createModel(config: ModelConfig) {
  const model = gateway(config.model);

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
export const GENERATOR_MODEL: ModelConfig = {
  model: "anthropic/claude-haiku-4.5",
  providerOptions: {},
};

export const VALIDATOR_MODEL: ModelConfig = {
  model: "anthropic/claude-haiku-4.5",
  providerOptions: {},
};
