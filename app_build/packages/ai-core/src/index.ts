// ==========================================
// @mars-memory/ai-core — Public API
// ==========================================

// Tools layer (factory functions & adapters)
export {
  createImageTools, makeSupabaseUploader,
  createDatabaseTools, makeNoOpDbAdapter, makeSupabaseDbAdapter,
  validateUniformSchema, assertValidUniformSchema, mergeUniformSchemas,
  composeTools,
  // LangChain tools (for createDeepAgent / tool-calling agents)
  createSearchUniformsTool, createGetUniformSchemaTool,
  createUpdateJobStatusTool, createLangChainTools,
  // Specialist tools (per-subagent, coordinator-worker architecture)
  createAllSpecialistTools,
} from "./tools/index.js";
export type { ImageToolDeps, DatabaseToolDeps, SchemaValidationResult, ComposeToolsOptions, LangChainToolDeps, SpecialistToolDeps } from "./tools/index.js";

// Re-export deepagents & langchain tool for convenience
export { createDeepAgent, StateBackend } from "deepagents";
export { tool } from "langchain";

// LLM abstraction layer — backed by LangChain initChatModel
export { createChatModel, resolveModelId, createVisionMessage } from "./llm/index.js";
export { HumanMessage, SystemMessage, AIMessage, JsonOutputParser } from "./llm/index.js";
export type { BaseChatModel, BaseMessage, LLMProviderName, ChatModelOptions } from "./llm/index.js";
export type { OpenAIModelOptions, GeminiModelOptions, OllamaModelOptions, ModelOptions } from "./llm/index.js";

// Memory layer
export type { MemoryStore } from "./memory/index.js";
export { InMemoryStore, EpisodicMemory } from "./memory/index.js";
export type { EpisodicEntry } from "./memory/index.js";

// Agent contracts & tool injection
export type { AgentTools, AgentContext, AgentResult } from "./agents/index.js";

// Specialist agents (A1–A9)
export { runImageAnalysisAgent, runPeriodIdentificationAgent, runKnowledgeRetrievalAgent } from "./agents/index.js";
export type { ImageAnalysisResult, PeriodIdentificationResult } from "./agents/index.js";

// Orchestrator
export { Orchestrator } from "./orchestrator/index.js";
export type { OrchestratorOptions, OrchestratorRunOptions, OrchestratorResult } from "./orchestrator/index.js";
