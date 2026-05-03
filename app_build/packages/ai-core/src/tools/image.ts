import type { AgentTools } from "../agents/index.js";

// ==========================================
// Image Tools
// Wraps all image I/O operations.
// Concrete implementation is injected; this file provides
// factory helpers so the API route doesn't have to inline logic.
// ==========================================

export interface ImageToolDeps {
  /**
   * Upload a raw buffer to cloud storage and return the public URL.
   * Default: Supabase Storage.  Swap for S3/R2 without touching agents.
   */
  uploadBuffer: (bucket: string, path: string, buffer: Buffer, contentType: string) => Promise<string>;
}

/**
 * Creates the image-related AgentTools implementations.
 *
 * Usage in API route:
 * ```ts
 * import { createImageTools } from "@mars-memory/ai-core/tools";
 * const tools = createImageTools({ uploadBuffer: supabaseUpload });
 * ```
 */
export function createImageTools(deps: ImageToolDeps): Pick<AgentTools, "storeImage" | "saveColorizedImage"> {
  return {
    storeImage: async (buffer, filename) => {
      return deps.uploadBuffer("uniforms-raw", `uploads/${filename}`, buffer, "image/jpeg");
    },

    saveColorizedImage: async (jobId, buffer) => {
      return deps.uploadBuffer("uniforms-colorized", `results/${jobId}.jpg`, buffer, "image/jpeg");
    },
  };
}

// ---- Supabase Storage adapter (ready to wire up when @mars-memory/db has the client) ----

/**
 * Supabase Storage upload adapter.
 * Import this in your API route after wiring the Supabase client.
 *
 * @example
 * ```ts
 * import { getSupabaseClient } from "@mars-memory/db";
 * import { makeSupabaseUploader } from "@mars-memory/ai-core/tools";
 *
 * const tools = createImageTools({ uploadBuffer: makeSupabaseUploader(getSupabaseClient()) });
 * ```
 */
export function makeSupabaseUploader(
  supabase: { storage: { from: (bucket: string) => { upload: (path: string, buffer: Buffer, opts: object) => Promise<{ data: { path: string } | null; error: unknown }> }; getPublicUrl: (path: string) => { data: { publicUrl: string } } } },
): ImageToolDeps["uploadBuffer"] {
  return async (bucket, path, buffer, contentType) => {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType, upsert: true });

    if (error) throw new Error(`Supabase Storage upload failed: ${String(error)}`);

    const { data } = supabase.storage.getPublicUrl(path);
    return data.publicUrl;
  };
}
