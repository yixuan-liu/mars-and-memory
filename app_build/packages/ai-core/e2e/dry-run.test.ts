import { test, expect } from "vitest";
import { Orchestrator, createChatModel, composeTools, makeNoOpDbAdapter } from "../src/index.js";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

/**
 * Dry-run integration test for the DeepAgents coordinator-worker pipeline.
 *
 * Requires:
 *   - LLM_MODEL_ID  (e.g. "google-genai:gemini-3-flash-preview")
 *   - GOOGLE_API_KEY (or the provider-specific key)
 *
 * Run:
 *   LLM_MODEL_ID="google-genai:gemini-3-flash-preview" \
 *   GOOGLE_API_KEY="<key>" \
 *   pnpm --filter @mars-memory/ai-core test
 */
test("dry-run deepagents pipeline", async () => {
  // 1. Resolve model & API key from environment
  const modelId = process.env.LLM_MODEL_ID ?? "google-genai:gemini-3-flash-preview";
  const apiKey = process.env.GOOGLE_API_KEY ?? process.env.LLM_API_KEY;

  if (!apiKey) {
    console.warn("⚠️  No API key found — set GOOGLE_API_KEY or LLM_API_KEY. Skipping.");
    return;
  }

  console.log(`Initializing model: ${modelId}`);
  const llm = await createChatModel(modelId, { apiKey });

  const tools = composeTools({
    database: makeNoOpDbAdapter(),
  });

  const orchestrator = new Orchestrator({ llm, tools });
  const jobId = randomUUID();

  console.log("Starting orchestrator for jobId", jobId);

  const imageUrl =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/" +
    "109._H.M._Kong_Haakon_VII_-_f%C3%B8dt_i_1872%2C_norsk_konge_fra_1905" +
    "_-_no-nb_digifoto_20160111_00011_bldsa_pk_kgl0076.jpg/" +
    "1920px-109._H.M._Kong_Haakon_VII_-_f%C3%B8dt_i_1872%2C_norsk_konge_fra_1905" +
    "_-_no-nb_digifoto_20160111_00011_bldsa_pk_kgl0076.jpg";

  console.log("Using image URL:", imageUrl);

  const result = await orchestrator.run({
    jobId,
    request: {
      image: { type: "url", url: imageUrl },
      hints: {
        estimatedPeriod: "1947",
        country: "Norway",
        branch: "Navy",
      },
    },
  });

  // Persist logs for analysis (in the e2e folder)
  const logPath = path.join(__dirname, "dry-run-logs.json");
  fs.writeFileSync(logPath, JSON.stringify(result, null, 2));
  console.log(`\n✅ Orchestrator run complete! Logs saved to: ${logPath}`);

  expect(result.success).toBe(true);
  expect(result.jobId).toBe(jobId);
}, 300_000); // 5 minute timeout — multi-agent pipeline
