import type { UniformSchema } from "@mars-memory/types";

// ==========================================
// Schema Tools
// Validates JSON against the UniformSchema contract
// using Zod (already a project dependency, no extra deps needed).
// ==========================================

import { UniformSchemaSchema } from "@mars-memory/types";
import type { z } from "zod";

export interface SchemaValidationResult<T> {
  valid: boolean;
  data?: T;
  errors?: z.ZodIssue[];
}

/**
 * Validates a raw object against the UniformSchemaSchema.
 * Used by the SchemaGeneration and ExpertReview agents
 * to confirm LLM output is well-formed before persisting.
 */
export function validateUniformSchema(raw: unknown): SchemaValidationResult<UniformSchema> {
  const result = UniformSchemaSchema.safeParse(raw);
  if (result.success) {
    return { valid: true, data: result.data };
  }
  return { valid: false, errors: result.error.issues };
}

/**
 * Asserts a UniformSchema is valid and throws with a descriptive message if not.
 * Convenience wrapper for agent code that wants to fail fast.
 */
export function assertValidUniformSchema(raw: unknown): UniformSchema {
  const result = validateUniformSchema(raw);
  if (!result.valid || !result.data) {
    const summary = result.errors?.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    throw new Error(`Invalid UniformSchema: ${summary}`);
  }
  return result.data;
}

/**
 * Merges two partial UniformSchemas, preferring values from `override`.
 * Used by SchemaGeneration agent when combining retrieved knowledge with LLM output.
 */
export function mergeUniformSchemas(base: UniformSchema, override: Partial<UniformSchema>): UniformSchema {
  return assertValidUniformSchema({
    ...base,
    ...override,
    colors: override.colors ?? base.colors,
    metadata: {
      ...base.metadata,
      ...override.metadata,
      sources: [
        ...new Set([...(base.metadata.sources ?? []), ...(override.metadata?.sources ?? [])]),
      ],
      lastUpdated: new Date().toISOString(),
    },
  });
}
