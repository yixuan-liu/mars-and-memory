import { NextRequest, NextResponse } from "next/server";
import { ColorizeRequestSchema, ColorizeResponseSchema } from "@mars-memory/types";
import { Orchestrator, createChatModel, resolveModelId, composeTools, makeNoOpDbAdapter } from "@mars-memory/ai-core";
import { randomUUID } from "crypto";

// ==========================================
// POST /api/colorize
// Mode A — Agent logic runs inside Next.js server
//
// ⚠️  When processing time consistently exceeds Vercel's 10s limit,
//     migrate to Mode B: forward this request to apps/agent/ service.
//     Only the URL changes; ai-core code stays identical.
// ==========================================

export async function POST(req: NextRequest) {
  // 1. Parse & validate the request body
  const body = await req.json().catch(() => null);
  const parsed = ColorizeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const jobId = randomUUID();
  const origin = req.nextUrl.origin;

  // 2. Wire up tools via composeTools()
  //    Phase 1: all no-op stubs via makeNoOpDbAdapter()
  //    Phase 2: swap in makeSupabaseDbAdapter(getSupabaseClient()) + makeSupabaseUploader(...)
  const tools = composeTools({
    database: makeNoOpDbAdapter(),
    // image: { uploadBuffer: makeSupabaseUploader(getSupabaseClient()) },  ← Phase 2
  });

  // 3. Build orchestrator — model resolved from env vars via provider:model format
  //    Set LLM_PROVIDER=openai and LLM_MODEL=gpt-4o (or gemini, ollama, etc.)
  //    Or set LLM_MODEL_ID=openai:gpt-4o directly for full control
  const modelId = process.env.LLM_MODEL_ID ?? resolveModelId();
  const llm = await createChatModel(modelId, {
    apiKey: process.env.LLM_API_KEY,
  });

  const orchestrator = new Orchestrator({ llm, tools });

  // 4. Run pipeline (fire-and-forget for long jobs; await for short ones)
  //    For production, replace with a background queue (Supabase pg_cron, BullMQ, etc.)
  orchestrator.run({ jobId, request: parsed.data }).catch((err: unknown) => {
    console.error(`[job:${jobId}] pipeline error`, err);
  });

  // 5. Return immediately with the job ID so the client can poll
  const response = ColorizeResponseSchema.parse({
    jobId,
    status: "pending",
    statusUrl: `${origin}/api/colorize/${jobId}`,
  });

  return NextResponse.json(response, { status: 202 });
}
