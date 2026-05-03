import { z } from "zod";

// ==========================================
// Agent Communication Types
// Zod Schemas for the AI pipeline I/O —
// shared across ai-core, api routes, and front-end hooks
// ==========================================

// --- Uniform Color Knowledge (JSON Schema–driven knowledge base) ---

export const ColorComponentSchema = z.object({
  /** Anatomical component of the uniform, e.g. "jacket_body", "sleeve_lace" */
  component: z.string(),
  /** Hex value of the historically accurate color */
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  /** Human-readable color name, e.g. "Navy Blue", "Gold Bullion" */
  colorName: z.string(),
  /** Confidence in [0, 1] from the expert-review agent */
  confidence: z.number().min(0).max(1),
  /** Archival or bibliographic source */
  source: z.string(),
});
export type ColorComponent = z.infer<typeof ColorComponentSchema>;

export const UniformSchemaSchema = z.object({
  uniformId: z.string(),
  /** Historical period, e.g. "1895-1905" */
  period: z.string(),
  country: z.string(),
  /** Military branch, e.g. "US Navy", "Imperial Japanese Army" */
  branch: z.string(),
  rank: z.string().optional(),
  colors: z.array(ColorComponentSchema),
  metadata: z.object({
    sources: z.array(z.string()),
    lastUpdated: z.string().datetime(),
    schemaVersion: z.string().default("1.0"),
  }),
});
export type UniformSchema = z.infer<typeof UniformSchemaSchema>;

// --- Agent Execution Trace ---

export const AgentStepSchema = z.object({
  agentName: z.string(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  /** Arbitrary per-agent result payload */
  result: z.unknown(),
  /** Optional error message if the step failed but pipeline continued */
  error: z.string().optional(),
});
export type AgentStep = z.infer<typeof AgentStepSchema>;

// --- Colorize Job (API Gateway ↔ ai-core contract) ---

export const ColorizeJobStatusSchema = z.enum([
  "pending",
  "analyzing",
  "retrieving",
  "colorizing",
  "reviewing",
  "completed",
  "failed",
]);
export type ColorizeJobStatus = z.infer<typeof ColorizeJobStatusSchema>;

export const ColorizeJobSchema = z.object({
  jobId: z.string().uuid(),
  status: ColorizeJobStatusSchema,
  /** URL of the uploaded B&W source image */
  inputImageUrl: z.string().url(),
  /** URL of the colorized output (set when status === "completed") */
  outputImageUrl: z.string().url().optional(),
  /** The resolved uniform knowledge used for colorization */
  uniformSchema: UniformSchemaSchema.optional(),
  /** Step-by-step execution trace from each agent */
  agentTrace: z.array(AgentStepSchema).optional(),
  /** Overall confidence score [0, 1] from the expert-review agent */
  overallConfidence: z.number().min(0).max(1).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ColorizeJob = z.infer<typeof ColorizeJobSchema>;

// --- API Request / Response shapes ---

export const ColorizeRequestSchema = z.object({
  /** base64-encoded image OR a pre-uploaded URL */
  image: z.union([
    z.object({ type: z.literal("base64"), data: z.string(), mimeType: z.string() }),
    z.object({ type: z.literal("url"), url: z.string().url() }),
  ]),
  /** Optional user-supplied hints to seed the period-identification agent */
  hints: z.object({
    estimatedPeriod: z.string().optional(),
    country: z.string().optional(),
    branch: z.string().optional(),
  }).optional(),
});
export type ColorizeRequest = z.infer<typeof ColorizeRequestSchema>;

export const ColorizeResponseSchema = z.object({
  jobId: z.string().uuid(),
  status: ColorizeJobStatusSchema,
  /** Polling URL for status updates (Mode A: same-origin, Mode B: agent-service URL) */
  statusUrl: z.string().url(),
});
export type ColorizeResponse = z.infer<typeof ColorizeResponseSchema>;
