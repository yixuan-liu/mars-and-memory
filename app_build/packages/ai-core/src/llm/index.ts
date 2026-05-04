// ==========================================
// LLM Abstraction Layer — backed by LangChain
//
// GAP 2 FIX: Replaced the manual switch/case factory with LangChain's
// `initChatModel` which uses the `provider:model` string format.
// This eliminates direct imports of provider-specific packages and
// supports new models/providers with zero code changes.
// ==========================================

import { initChatModel } from "langchain/chat_models/universal";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

// Re-export LangChain message types so agents don't need to import @langchain/core directly
export { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
export type { BaseMessage } from "@langchain/core/messages";
export type { BaseChatModel } from "@langchain/core/language_models/chat_models";

// Re-export structured output for agents that need type-safe JSON
export { JsonOutputParser } from "@langchain/core/output_parsers";

// ==========================================
// Model initialization via initChatModel
// ==========================================

/**
 * Options for `createChatModel`. All fields are optional — sensible
 * defaults are applied by LangChain's `initChatModel`.
 */
export interface ChatModelOptions {
  /** API key for the provider. Falls back to env vars (OPENAI_API_KEY, etc.) */
  apiKey?: string;
  /** Temperature for generation. Default: 0.2 */
  temperature?: number;
  /** Max output tokens. Default: provider-specific */
  maxTokens?: number;
  /** Max retries on transient errors. Default: 6 */
  maxRetries?: number;
}

// Legacy type aliases — kept for backward compatibility
export type LLMProviderName = "openai" | "gemini" | "ollama";
export type OpenAIModelOptions = ChatModelOptions;
export type GeminiModelOptions = ChatModelOptions;
export type OllamaModelOptions = ChatModelOptions & { baseUrl?: string; model: string };
export type ModelOptions = ChatModelOptions;

/**
 * Create a LangChain `BaseChatModel` via `initChatModel`.
 *
 * Supports the `provider:model` string format from the LangChain ecosystem.
 * Provider packages are resolved automatically — no manual imports needed.
 *
 * @example
 * ```ts
 * // Provider:model format (recommended)
 * const llm = await createChatModel("openai:gpt-4o");
 * const llm = await createChatModel("google-genai:gemini-2.0-flash");
 * const llm = await createChatModel("ollama:llava");
 * const llm = await createChatModel("anthropic:claude-sonnet-4-6");
 *
 * // With options
 * const llm = await createChatModel("openai:gpt-4o", {
 *   apiKey: "sk-...",
 *   temperature: 0,
 *   maxTokens: 4096,
 * });
 *
 * // Model name only (provider auto-detected)
 * const llm = await createChatModel("gpt-4o");
 * ```
 */
export async function createChatModel(
  modelId: string,
  options: ChatModelOptions = {},
): Promise<BaseChatModel> {
  const { apiKey, temperature = 0.2, maxTokens, maxRetries } = options;

  return initChatModel(modelId, {
    temperature,
    ...(apiKey ? { apiKey } : {}),
    ...(maxTokens ? { maxTokens } : {}),
    ...(maxRetries ? { maxRetries } : {}),
  }) as Promise<BaseChatModel>;
}

/**
 * Resolve a model identifier from environment variables.
 *
 * Reads `LLM_PROVIDER` and `LLM_MODEL` env vars and produces
 * a `provider:model` string for `createChatModel`.
 *
 * @example
 * ```ts
 * // With LLM_PROVIDER=openai, LLM_MODEL=gpt-4o:
 * resolveModelId() // → "openai:gpt-4o"
 *
 * // With LLM_PROVIDER=ollama, LLM_MODEL=llava:
 * resolveModelId() // → "ollama:llava"
 *
 * // No env vars set:
 * resolveModelId() // → "openai:gpt-4o" (default)
 * ```
 */
export function resolveModelId(): string {
  const provider = process.env.LLM_PROVIDER ?? "openai";
  const model = process.env.LLM_MODEL;

  // Map legacy provider names to LangChain provider identifiers
  const providerMap: Record<string, string> = {
    openai: "openai",
    gemini: "google-genai",
    ollama: "ollama",
    anthropic: "anthropic",
    azure: "azure_openai",
  };

  const lcProvider = providerMap[provider] ?? provider;

  // Default model names per provider
  const defaultModels: Record<string, string> = {
    openai: "gpt-4o",
    "google-genai": "gemini-2.0-flash",
    ollama: "llama3",
    anthropic: "claude-sonnet-4-6",
    azure_openai: "gpt-4o",
  };

  const resolvedModel = model ?? defaultModels[lcProvider] ?? "gpt-4o";
  return `${lcProvider}:${resolvedModel}`;
}

// ==========================================
// Multimodal helpers
// Convenience functions for building vision messages
// using LangChain's HumanMessage content format.
// ==========================================

import { HumanMessage } from "@langchain/core/messages";
import type { MessageContentImageUrl, MessageContentText } from "@langchain/core/messages";

type LCContentPart = MessageContentText | MessageContentImageUrl;

/**
 * Build a multimodal HumanMessage with text + image.
 * Works universally by converting URLs to base64 data URLs,
 * which are supported by OpenAI, Gemini, and Anthropic.
 */
export async function createVisionMessage(
  text: string,
  image: { type: "url"; url: string } | { type: "base64"; data: string; mimeType: string },
): Promise<HumanMessage> {
  const parts: LCContentPart[] = [];

  if (image.type === "url") {
    // Fetch and convert to base64 since some providers (e.g. Gemini) strictly require data URLs
    const res = await fetch(image.url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = res.headers.get("content-type") || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
    parts.push({ type: "image_url", image_url: { url: dataUrl } });
  } else {
    parts.push({
      type: "image_url",
      image_url: { url: `data:${image.mimeType};base64,${image.data}` },
    });
  }

  parts.push({ type: "text", text });

  return new HumanMessage({ content: parts });
}
