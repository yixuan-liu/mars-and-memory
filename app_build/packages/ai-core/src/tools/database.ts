import type { AgentTools } from "../agents/index.js";
import type { UniformSchema } from "@mars-memory/types";

// ==========================================
// Database Tools
// Wraps all persistence and vector-search operations.
// Agents call these via the injected AgentTools interface —
// they never import Supabase or any DB client directly.
// ==========================================

export interface DatabaseToolDeps {
  /**
   * Perform a semantic similarity search over the uniform knowledge base.
   * In production: Supabase pgvector RPC.
   * In development: returns [] (no-op stub).
   */
  vectorSearch: (query: string, topK: number) => Promise<UniformSchema[]>;

  /** Upsert a UniformSchema record into the database. */
  upsertUniformSchema: (schema: UniformSchema) => Promise<void>;

  /** Fetch a single UniformSchema by its uniformId. */
  fetchUniformSchema: (uniformId: string) => Promise<UniformSchema | undefined>;

  /** Update the status column of a colorize_jobs row. */
  updateJobStatus: (jobId: string, status: string) => Promise<void>;
}

/**
 * Creates the database-related AgentTools implementations.
 *
 * @example
 * ```ts
 * import { createDatabaseTools, makeSupabaseDbAdapter } from "@mars-memory/ai-core/tools";
 * import { getSupabaseClient } from "@mars-memory/db";
 *
 * const tools = createDatabaseTools(makeSupabaseDbAdapter(getSupabaseClient()));
 * ```
 */
export function createDatabaseTools(deps: DatabaseToolDeps): Pick<
  AgentTools,
  "searchUniforms" | "saveUniformSchema" | "getUniformSchema" | "updateJobStatus"
> {
  return {
    searchUniforms: (query, topK = 5) => deps.vectorSearch(query, topK),

    saveUniformSchema: (schema) => deps.upsertUniformSchema(schema),

    getUniformSchema: (uniformId) => deps.fetchUniformSchema(uniformId),

    updateJobStatus: (jobId, status) => deps.updateJobStatus(jobId, status),
  };
}

// ---- No-op stub adapter (Phase 1 / development) ----

/**
 * Returns a stub adapter where all DB operations are no-ops.
 * Use this in Phase 1 before Supabase tables are created.
 */
export function makeNoOpDbAdapter(): DatabaseToolDeps {
  return {
    vectorSearch: async (_query, _topK) => {
      console.warn("[db:stub] vectorSearch called — returning mock result");
      return [{
        uniformId: "mock-uniform-123",
        period: "1905-1957",
        country: "Norway",
        branch: "Navy",
        rank: "Admiral",
        colors: [
          { component: "tunic", colorHex: "#000080", colorName: "Navy Blue", confidence: 0.95, source: "mock-db" },
          { component: "epaulettes", colorHex: "#FFD700", colorName: "Gold", confidence: 0.9, source: "mock-db" }
        ],
        metadata: {
          sources: ["mock-db"],
          lastUpdated: new Date().toISOString(),
          schemaVersion: "1.0"
        }
      }];
    },
    upsertUniformSchema: async (schema) => {
      console.warn("[db:stub] upsertUniformSchema called", schema.uniformId);
    },
    fetchUniformSchema: async (_uniformId) => {
      console.warn("[db:stub] fetchUniformSchema called — returning undefined");
      return undefined;
    },
    updateJobStatus: async (jobId, status) => {
      console.info(`[db:stub] job:${jobId} → ${status}`);
    },
  };
}

// ---- Supabase adapter (Phase 2 — wire up when tables exist) ----

/**
 * Production Supabase adapter.
 * Swap out `makeNoOpDbAdapter()` for this once the DB schema is ready.
 *
 * Required Supabase tables:
 *   - uniform_schemas (id, data jsonb)
 *   - colorize_jobs   (id, status text, ...)
 *
 * Required RPC function:
 *   - match_uniforms(query_embedding vector, match_threshold float, match_count int)
 *
 * @example
 * ```ts
 * import { getSupabaseClient } from "@mars-memory/db";
 * const tools = createDatabaseTools(makeSupabaseDbAdapter(getSupabaseClient()));
 * ```
 */
export function makeSupabaseDbAdapter(
  // Using `unknown` here keeps @mars-memory/ai-core free of the @supabase/supabase-js dep.
  // The concrete Supabase client is only referenced in the API route layer.
  supabase: {
    from: (table: string) => {
      select: (cols?: string) => {
        eq: (col: string, val: string) => Promise<{ data: unknown[] | null; error: unknown }>;
      };
      update: (data: object) => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
      upsert: (data: object) => Promise<{ error: unknown }>;
    };
    rpc: (fn: string, params: object) => Promise<{ data: unknown[] | null; error: unknown }>;
  },
): DatabaseToolDeps {
  return {
    vectorSearch: async (query, topK) => {
      // TODO: generate embedding for `query` via LLM embedding API, then call RPC
      // const embedding = await generateEmbedding(query);
      // const { data, error } = await supabase.rpc('match_uniforms', { query_embedding: embedding, match_threshold: 0.7, match_count: topK });
      console.warn("[db:supabase] vectorSearch: embedding not yet implemented — returning []");
      return [];
    },

    upsertUniformSchema: async (schema) => {
      const { error } = await supabase.from("uniform_schemas").upsert({ id: schema.uniformId, data: schema });
      if (error) throw new Error(`upsertUniformSchema failed: ${String(error)}`);
    },

    fetchUniformSchema: async (uniformId) => {
      const { data, error } = await supabase.from("uniform_schemas").select("data").eq("id", uniformId);
      if (error) throw new Error(`fetchUniformSchema failed: ${String(error)}`);
      return (data?.[0] as { data: UniformSchema } | undefined)?.data;
    },

    updateJobStatus: async (jobId, status) => {
      const { error } = await supabase.from("colorize_jobs").update({ status, updated_at: new Date().toISOString() }).eq("id", jobId);
      if (error) throw new Error(`updateJobStatus failed: ${String(error)}`);
    },
  };
}
