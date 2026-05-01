import { tool } from "langchain";
import { z } from "zod";
import type { UniformSchema, ColorizeJobStatus } from "@mars-memory/types";

// ==========================================
// LangChain Tools — created via `tool()` from langchain
// These are the tools that createDeepAgent can bind to the LLM,
// enabling the agent to autonomously decide which tool to call.
//
// Infrastructure adapters (image upload, DB queries) are injected
// at creation time via the `deps` parameter — tools remain
// platform-agnostic.
// ==========================================

// --- Tool Dependency Injection ---

export interface LangChainToolDeps {
  searchUniforms?: (query: string, topK: number) => Promise<UniformSchema[]>;
  saveUniformSchema?: (schema: UniformSchema) => Promise<void>;
  getUniformSchema?: (uniformId: string) => Promise<UniformSchema | undefined>;
  updateJobStatus?: (jobId: string, status: ColorizeJobStatus) => Promise<void>;
  storeImage?: (buffer: Buffer, filename: string) => Promise<string>;
}

// --- Tool Factories ---

export function createSearchUniformsTool(deps: LangChainToolDeps) {
  return tool(
    async ({ query, topK }) => {
      const results = await deps.searchUniforms?.(query, topK) ?? [];
      return JSON.stringify(results);
    },
    {
      name: "search_uniforms",
      description: "Search the military uniform knowledge base by period, country, branch, and rank. Returns matching UniformSchema records with historical color data.",
      schema: z.object({
        query: z.string().describe("Search query, e.g. '1899 US Navy Officer Frock Coat'"),
        topK: z.number().default(5).describe("Maximum number of results to return"),
      }),
    },
  );
}

export function createGetUniformSchemaTool(deps: LangChainToolDeps) {
  return tool(
    async ({ uniformId }) => {
      const schema = await deps.getUniformSchema?.(uniformId);
      return schema ? JSON.stringify(schema) : "Not found";
    },
    {
      name: "get_uniform_schema",
      description: "Retrieve a specific UniformSchema by its unique ID.",
      schema: z.object({
        uniformId: z.string().describe("The unique uniform identifier, e.g. 'us-navy-frock-1899'"),
      }),
    },
  );
}

export function createUpdateJobStatusTool(deps: LangChainToolDeps) {
  return tool(
    async ({ jobId, status }) => {
      await deps.updateJobStatus?.(jobId, status as ColorizeJobStatus);
      return `Job ${jobId} status updated to ${status}`;
    },
    {
      name: "update_job_status",
      description: "Update the status of a colorization job in the database.",
      schema: z.object({
        jobId: z.string().describe("UUID of the colorization job"),
        status: z.enum(["pending", "analyzing", "retrieving", "colorizing", "reviewing", "completed", "failed"]),
      }),
    },
  );
}

/**
 * Creates all LangChain tools for use with createDeepAgent.
 *
 * @example
 * ```ts
 * import { createLangChainTools } from "@mars-memory/ai-core";
 * import { createDeepAgent } from "deepagents";
 *
 * const tools = createLangChainTools({ searchUniforms: mySearchFn });
 * const agent = createDeepAgent({ tools, systemPrompt: "..." });
 * ```
 */
export function createLangChainTools(deps: LangChainToolDeps) {
  return [
    createSearchUniformsTool(deps),
    createGetUniformSchemaTool(deps),
    createUpdateJobStatusTool(deps),
  ];
}
