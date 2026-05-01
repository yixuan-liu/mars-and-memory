// ==========================================
// @mars-memory/ai-core — Tools barrel
// All tool factory functions and adapters
// ==========================================

// Image I/O tools
export { createImageTools, makeSupabaseUploader } from "./image.js";
export type { ImageToolDeps } from "./image.js";

// Database & vector search tools
export { createDatabaseTools, makeNoOpDbAdapter, makeSupabaseDbAdapter } from "./database.js";
export type { DatabaseToolDeps } from "./database.js";

// JSON Schema validation tools
export { validateUniformSchema, assertValidUniformSchema, mergeUniformSchemas } from "./schema.js";
export type { SchemaValidationResult } from "./schema.js";

// LangChain tools (for use with createDeepAgent / tool-calling agents)
export { createSearchUniformsTool, createGetUniformSchemaTool, createUpdateJobStatusTool, createLangChainTools } from "./langchain.js";
export type { LangChainToolDeps } from "./langchain.js";

// Specialist tools (per-subagent tools for coordinator-worker architecture)
export { createAllSpecialistTools, createAnalyzePhotographTool, createIdentifyPeriodTool, createRetrieveKnowledgeTool, createGenerateSchemaTool, createReviewSchemaTool, createUpdateStatusTool, createSaveResultsTool } from "./specialist.js";
export type { SpecialistToolDeps } from "./specialist.js";

// ==========================================
// Convenience: compose all tools into a single AgentTools object
// ==========================================

import { createImageTools } from "./image.js";
import { createDatabaseTools, makeNoOpDbAdapter } from "./database.js";
import type { ImageToolDeps, } from "./image.js";
import type { DatabaseToolDeps } from "./database.js";
import type { AgentTools } from "../agents/index.js";

export interface ComposeToolsOptions {
  image?: ImageToolDeps;
  database?: DatabaseToolDeps;
}

/**
 * Compose all available tools into a single AgentTools object.
 * Omitted categories fall back to no-op stubs.
 *
 * @example — Phase 1 (all stubs)
 * ```ts
 * const tools = composeTools({});
 * ```
 *
 * @example — Phase 2 (real DB, stub image)
 * ```ts
 * const tools = composeTools({
 *   database: makeSupabaseDbAdapter(getSupabaseClient()),
 * });
 * ```
 */
export function composeTools(options: ComposeToolsOptions = {}): AgentTools {
  const dbDeps = options.database ?? makeNoOpDbAdapter();
  const dbTools = createDatabaseTools(dbDeps);

  const imageTools = options.image
    ? createImageTools(options.image)
    : {};

  return {
    ...dbTools,
    ...imageTools,
  };
}
