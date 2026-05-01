import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { SystemMessage } from "@langchain/core/messages";
import { createVisionMessage } from "../llm/index.js";
import type { EpisodicMemory } from "../memory/index.js";
import type { AgentStep, UniformSchema, ColorizeJobStatus } from "@mars-memory/types";

// ==========================================
// Agent Base Types & Tool Injection Contract
// ==========================================

/**
 * Tools are injected into agents — agents NEVER import app or DB code directly.
 * This is the "tool injection" principle from the architecture.
 */
export interface AgentTools {
  /** Upload or retrieve an image from storage; returns a public URL */
  storeImage?: (buffer: Buffer, filename: string) => Promise<string>;
  /** Semantic search over the uniform knowledge base */
  searchUniforms?: (query: string, topK?: number) => Promise<UniformSchema[]>;
  /** Save a resolved UniformSchema to the database */
  saveUniformSchema?: (schema: UniformSchema) => Promise<void>;
  /** Retrieve a uniform schema by ID */
  getUniformSchema?: (uniformId: string) => Promise<UniformSchema | undefined>;
  /** Save the final colorized image; returns its URL */
  saveColorizedImage?: (jobId: string, buffer: Buffer) => Promise<string>;
  /** Update job status in the persistence layer */
  updateJobStatus?: (jobId: string, status: ColorizeJobStatus) => Promise<void>;
}

export interface AgentContext {
  jobId: string;
  /** LangChain BaseChatModel — provider-agnostic */
  llm: BaseChatModel;
  tools: AgentTools;
  episodic: EpisodicMemory;
}

export interface AgentResult<T = unknown> {
  agentName: string;
  success: boolean;
  data?: T;
  error?: string;
  step: AgentStep;
}

// ==========================================
// A1 — ImageAnalysis Agent
// Uses LangChain vision messages for multimodal input
// ==========================================

export interface ImageAnalysisResult {
  uniformDescription: string;
  visibleFeatures: string[];
  imageQuality: "low" | "medium" | "high";
  rawImageUrl: string;
}

export async function runImageAnalysisAgent(
  ctx: AgentContext,
  imageInput: { type: "url"; url: string } | { type: "base64"; data: string; mimeType: string },
): Promise<AgentResult<ImageAnalysisResult>> {
  const startedAt = new Date().toISOString();
  const agentName = "ImageAnalysis";

  try {
    const systemMsg = new SystemMessage(
      "You are an expert military uniform historian. Analyze photographs with precision."
    );

    const userMsg = createVisionMessage(
      "Analyze this black-and-white photograph. Describe the military uniform in detail: visible rank insignia, cut, collar style, buttons, accoutrements, headwear, and any period-indicating features. Return a JSON object with keys: uniformDescription (string), visibleFeatures (string[]), imageQuality ('low'|'medium'|'high').",
      imageInput,
    );

    // Use LangChain's invoke — provider handles multimodal natively
    const res = await ctx.llm.invoke([systemMsg, userMsg]);
    const content = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    const parsed = JSON.parse(content) as Omit<ImageAnalysisResult, "rawImageUrl">;

    const rawImageUrl = imageInput.type === "url" ? imageInput.url : "base64-input";
    const data: ImageAnalysisResult = { ...parsed, rawImageUrl };

    await ctx.episodic.record({
      jobId: ctx.jobId, agentName,
      timestamp: new Date().toISOString(),
      summary: parsed.uniformDescription,
      payload: data,
    });

    return { agentName, success: true, data, step: { agentName, startedAt, completedAt: new Date().toISOString(), result: data } };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { agentName, success: false, error, step: { agentName, startedAt, completedAt: new Date().toISOString(), result: null, error } };
  }
}

// ==========================================
// A2 — PeriodIdentification Agent
// ==========================================

export interface PeriodIdentificationResult {
  country: string;
  branch: string;
  estimatedPeriod: string;
  rank: string;
  confidence: number;
}

export async function runPeriodIdentificationAgent(
  ctx: AgentContext,
  uniformDescription: string,
  hints?: { estimatedPeriod?: string; country?: string; branch?: string },
): Promise<AgentResult<PeriodIdentificationResult>> {
  const startedAt = new Date().toISOString();
  const agentName = "PeriodIdentification";

  try {
    const hintText = hints ? `\n\nUser-supplied hints (treat as strong priors): ${JSON.stringify(hints)}` : "";

    const { HumanMessage } = await import("@langchain/core/messages");

    const res = await ctx.llm.invoke([
      new SystemMessage("You are a military history expert specialising in identifying uniform periods, countries, and ranks from descriptions."),
      new HumanMessage(`Based on this uniform description, identify the most likely country, military branch, decade (as a range, e.g. "1930-1940"), and rank. Return JSON with keys: country, branch, estimatedPeriod, rank, confidence (0–1).${hintText}\n\nDescription:\n${uniformDescription}`),
    ]);

    const content = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    const data = JSON.parse(content) as PeriodIdentificationResult;

    await ctx.episodic.record({
      jobId: ctx.jobId, agentName,
      timestamp: new Date().toISOString(),
      summary: `${data.country} ${data.branch} ${data.estimatedPeriod}`,
      payload: data,
    });

    return { agentName, success: true, data, step: { agentName, startedAt, completedAt: new Date().toISOString(), result: data } };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { agentName, success: false, error, step: { agentName, startedAt, completedAt: new Date().toISOString(), result: null, error } };
  }
}

// ==========================================
// A3 — KnowledgeRetrieval Agent
// ==========================================

export async function runKnowledgeRetrievalAgent(
  ctx: AgentContext,
  period: PeriodIdentificationResult,
): Promise<AgentResult<UniformSchema[]>> {
  const startedAt = new Date().toISOString();
  const agentName = "KnowledgeRetrieval";

  try {
    const query = `${period.estimatedPeriod} ${period.country} ${period.branch} ${period.rank}`;
    const schemas = await (ctx.tools.searchUniforms?.(query, 5) ?? Promise.resolve([]));

    await ctx.episodic.record({
      jobId: ctx.jobId, agentName,
      timestamp: new Date().toISOString(),
      summary: `Retrieved ${schemas.length} uniform schemas`,
      payload: schemas,
    });

    return { agentName, success: true, data: schemas, step: { agentName, startedAt, completedAt: new Date().toISOString(), result: schemas } };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { agentName, success: false, error, step: { agentName, startedAt, completedAt: new Date().toISOString(), result: null, error } };
  }
}


