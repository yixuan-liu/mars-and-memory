import { tool } from "langchain";
import { z } from "zod";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { SystemMessage } from "@langchain/core/messages";
import { createVisionMessage } from "../llm/index.js";
import type { AgentTools } from "../agents/index.js";

// ==========================================
// Specialist Tools — one per subagent
//
// Each subagent in the coordinator-worker architecture gets specialized
// tools that encapsulate its domain logic. The coordinator DeepAgent
// delegates work to subagents, and each subagent uses these tools
// autonomously.
//
// Tools use closures to capture the LLM and infrastructure deps,
// keeping the tool interface clean for the agent.
// ==========================================

export interface SpecialistToolDeps {
  llm: BaseChatModel;
  infra: AgentTools;
}

// ---- A1: Image Analyst subagent tool ----

export function createAnalyzePhotographTool(deps: SpecialistToolDeps) {
  return tool(
    async ({ imageUrl }) => {
      const systemMsg = new SystemMessage(
        "You are an expert military uniform historian. Analyze photographs with extreme precision. " +
        "Focus on: rank insignia, uniform cut, collar style, buttons, accoutrements, headwear, and period-indicating features."
      );
      const userMsg = createVisionMessage(
        "Analyze this black-and-white military photograph. Return a JSON object with keys: " +
        "uniformDescription (string), visibleFeatures (string[]), imageQuality ('low'|'medium'|'high').",
        { type: "url", url: imageUrl },
      );

      const res = await deps.llm.invoke([systemMsg, userMsg]);
      return typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    },
    {
      name: "analyze_photograph",
      description: "Analyze a black-and-white military photograph using computer vision. Returns a JSON description of the uniform including visible features and image quality assessment.",
      schema: z.object({
        imageUrl: z.string().describe("URL of the photograph to analyze"),
      }),
    },
  );
}

// ---- A2: Period Identifier subagent tool ----

export function createIdentifyPeriodTool(deps: SpecialistToolDeps) {
  return tool(
    async ({ uniformDescription, hints }) => {
      const { HumanMessage } = await import("@langchain/core/messages");
      const hintText = hints ? `\n\nUser-supplied hints (treat as strong priors): ${hints}` : "";

      const res = await deps.llm.invoke([
        new SystemMessage(
          "You are a military history expert specialising in identifying uniform periods, countries, and ranks from descriptions."
        ),
        new HumanMessage(
          `Based on this uniform description, identify the most likely country, military branch, decade (as a range, e.g. "1930-1940"), and rank. Return JSON with keys: country, branch, estimatedPeriod, rank, confidence (0–1).${hintText}\n\nDescription:\n${uniformDescription}`
        ),
      ]);

      return typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    },
    {
      name: "identify_period",
      description: "Identify the historical period, country, military branch, and rank from a uniform description. Returns JSON with country, branch, estimatedPeriod, rank, confidence.",
      schema: z.object({
        uniformDescription: z.string().describe("Detailed description of the military uniform"),
        hints: z.string().optional().describe("Optional JSON hints like {country, estimatedPeriod, branch}"),
      }),
    },
  );
}

// ---- A3: Knowledge Retriever subagent tool ----
// (reuses search_uniforms from langchain.ts, but this is the subagent-specific wrapper)

export function createRetrieveKnowledgeTool(deps: SpecialistToolDeps) {
  return tool(
    async ({ query, topK }) => {
      const results = await deps.infra.searchUniforms?.(query, topK) ?? [];
      return JSON.stringify(results, null, 2);
    },
    {
      name: "retrieve_uniform_knowledge",
      description: "Search the military uniform knowledge base by period, country, branch, and rank. Returns matching UniformSchema records with historical color data.",
      schema: z.object({
        query: z.string().describe("Search query, e.g. '1899 US Navy Officer Frock Coat'"),
        topK: z.number().default(5).describe("Maximum number of results to return"),
      }),
    },
  );
}

// ---- A4: Schema Generator subagent tool ----

export function createGenerateSchemaTool(deps: SpecialistToolDeps) {
  return tool(
    async ({ uniformDescription, period, country, branch, rank, existingSchemas }) => {
      const { HumanMessage } = await import("@langchain/core/messages");

      const res = await deps.llm.invoke([
        new SystemMessage(
          "You are a military uniform colorization expert. Generate a precise UniformSchema JSON object that maps each uniform component to its historically accurate color."
        ),
        new HumanMessage(
          `Based on the following information, generate a complete UniformSchema JSON:\n\n` +
          `Uniform: ${uniformDescription}\n` +
          `Period: ${period}\nCountry: ${country}\nBranch: ${branch}\nRank: ${rank}\n\n` +
          `Existing reference schemas:\n${existingSchemas}\n\n` +
          `Return a JSON object with keys: uniformId, period, country, branch, rank, colors (array of {component, colorHex, colorName, confidence, source}), metadata.`
        ),
      ]);

      return typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    },
    {
      name: "generate_uniform_schema",
      description: "Generate a complete UniformSchema with historically accurate color mappings for each uniform component.",
      schema: z.object({
        uniformDescription: z.string(),
        period: z.string(),
        country: z.string(),
        branch: z.string(),
        rank: z.string(),
        existingSchemas: z.string().default("[]").describe("JSON array of existing schemas for reference"),
      }),
    },
  );
}

// ---- A5: Prompt Constructor subagent tool ----

export function createConstructPromptTool(deps: SpecialistToolDeps) {
  return tool(
    async ({ schema }) => {
      const { HumanMessage } = await import("@langchain/core/messages");

      const res = await deps.llm.invoke([
        new SystemMessage(
          "You are a prompt engineering expert specializing in multimodal image generation and colorization. " +
          "Your task is to take a structured UniformSchema and convert it into a highly detailed, descriptive prompt suitable for models like Stable Diffusion or Midjourney."
        ),
        new HumanMessage(
          `Convert this UniformSchema into a rich visual prompt for colorizing a black-and-white photograph. ` +
          `Specify the precise colors for the tunic, trousers, facings, buttons, headwear, and any accoutrements. ` +
          `Return ONLY the final prompt string.\n\nSchema:\n${schema}`
        ),
      ]);

      return typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    },
    {
      name: "construct_colorization_prompt",
      description: "Constructs an optimized visual prompt for an image colorization model based on the provided UniformSchema.",
      schema: z.object({
        schema: z.string().describe("JSON string of the UniformSchema"),
      }),
    },
  );
}

// ---- A6: Colorizer subagent tool ----

export function createColorizeTool(deps: SpecialistToolDeps) {
  return tool(
    async ({ imageUrl, prompt, jobId }) => {
      // In a real implementation, this would call an external Stable Diffusion/ControlNet API
      // For now, we simulate the process and save a mock result using the infra deps.
      const simulatedBuffer = Buffer.from(`mock-colorized-image-data-for-job-${jobId}`);
      
      let finalUrl = `https://mock-storage.mars-memory.local/colorized/${jobId}.jpg`;
      if (deps.infra.saveColorizedImage) {
        try {
          finalUrl = await deps.infra.saveColorizedImage(jobId, simulatedBuffer);
        } catch (e) {
          console.warn("Failed to save colorized image via infra, using fallback URL.", e);
        }
      }

      return JSON.stringify({
        success: true,
        originalImage: imageUrl,
        colorizedUrl: finalUrl,
        appliedPrompt: prompt,
      });
    },
    {
      name: "colorize_image",
      description: "Applies historically accurate colors to the photograph using the constructed prompt.",
      schema: z.object({
        jobId: z.string(),
        imageUrl: z.string().describe("URL of the original black-and-white photograph"),
        prompt: z.string().describe("The detailed colorization prompt"),
      }),
    },
  );
}

// ---- A7: Post Processor subagent tool ----

export function createPostProcessTool(deps: SpecialistToolDeps) {
  return tool(
    async ({ colorizedUrl }) => {
      const { HumanMessage } = await import("@langchain/core/messages");

      const res = await deps.llm.invoke([
        new SystemMessage(
          "You are an image post-processing expert. Review the colorized image metadata and suggest enhancement parameters."
        ),
        new HumanMessage(
          `Simulate post-processing parameters for the image at ${colorizedUrl}. ` +
          `Return JSON with keys: colorBalance, contrast, sharpness, artifactsRemoved (boolean).`
        ),
      ]);

      return typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    },
    {
      name: "post_process_image",
      description: "Post-processes the colorized image to adjust color balance and remove artifacts.",
      schema: z.object({
        colorizedUrl: z.string().describe("URL of the colorized image"),
      }),
    },
  );
}

// ---- A8: Expert Reviewer subagent tool ----

export function createReviewSchemaTool(deps: SpecialistToolDeps) {
  return tool(
    async ({ schema }) => {
      const { HumanMessage } = await import("@langchain/core/messages");

      const res = await deps.llm.invoke([
        new SystemMessage(
          "You are a senior military historian who reviews uniform color schemas for historical accuracy. " +
          "Check each color assignment against your knowledge. Flag any inaccuracies and suggest corrections."
        ),
        new HumanMessage(
          `Review this UniformSchema for historical accuracy. Return JSON with keys: ` +
          `approved (boolean), corrections (array of {component, issue, suggestedFix}), ` +
          `overallConfidence (0-1), notes (string).\n\nSchema:\n${schema}`
        ),
      ]);

      return typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    },
    {
      name: "review_schema_accuracy",
      description: "Review a UniformSchema for historical accuracy and flag any color assignment errors.",
      schema: z.object({
        schema: z.string().describe("JSON string of the UniformSchema to review"),
      }),
    },
  );
}

// ---- Coordinator-level tools (used by the orchestrator directly) ----

export function createUpdateStatusTool(deps: SpecialistToolDeps) {
  return tool(
    async ({ jobId, status }) => {
      await deps.infra.updateJobStatus?.(jobId, status as import("@mars-memory/types").ColorizeJobStatus);
      return `Job ${jobId} status updated to: ${status}`;
    },
    {
      name: "update_job_status",
      description: "Update the colorization job status. Use this to track pipeline progress.",
      schema: z.object({
        jobId: z.string(),
        status: z.enum(["pending", "analyzing", "retrieving", "colorizing", "reviewing", "completed", "failed"]),
      }),
    },
  );
}

export function createSaveResultsTool(deps: SpecialistToolDeps) {
  return tool(
    async ({ uniformSchema }) => {
      const parsed = JSON.parse(uniformSchema);
      await deps.infra.saveUniformSchema?.(parsed);
      return `UniformSchema saved successfully: ${parsed.uniformId}`;
    },
    {
      name: "save_results",
      description: "Save the final UniformSchema to the database after review.",
      schema: z.object({
        uniformSchema: z.string().describe("Complete UniformSchema as JSON string"),
      }),
    },
  );
}

// ---- A9: Output Compiler subagent tool ----

export function createCompileOutputTool(deps: SpecialistToolDeps) {
  return tool(
    async ({ colorizedUrl, schema, overallConfidence }) => {
      const { HumanMessage } = await import("@langchain/core/messages");

      const res = await deps.llm.invoke([
        new SystemMessage(
          "You are the final output compiler. Your job is to format the final delivery package."
        ),
        new HumanMessage(
          `Compile the final report for the user. Include the colorized image URL, a summary of the UniformSchema, and the overall historical confidence score.\n\n` +
          `URL: ${colorizedUrl}\nConfidence: ${overallConfidence}\nSchema: ${schema}\n\n` +
          `Return a beautifully formatted markdown string.`
        ),
      ]);

      return typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    },
    {
      name: "compile_output",
      description: "Compiles the final output package containing the colorized image, schema summary, and source attributions.",
      schema: z.object({
        colorizedUrl: z.string(),
        schema: z.string().describe("Reviewed UniformSchema"),
        overallConfidence: z.number().describe("Overall confidence score from the expert reviewer"),
      }),
    },
  );
}

// ==========================================
// Factory: create all specialist tools at once
// ==========================================

export function createAllSpecialistTools(deps: SpecialistToolDeps) {
  return {
    analyzePhotograph: createAnalyzePhotographTool(deps),
    identifyPeriod: createIdentifyPeriodTool(deps),
    retrieveKnowledge: createRetrieveKnowledgeTool(deps),
    generateSchema: createGenerateSchemaTool(deps),
    constructPrompt: createConstructPromptTool(deps),
    colorizeImage: createColorizeTool(deps),
    postProcessImage: createPostProcessTool(deps),
    reviewSchema: createReviewSchemaTool(deps),
    compileOutput: createCompileOutputTool(deps),
    updateStatus: createUpdateStatusTool(deps),
    saveResults: createSaveResultsTool(deps),
  };
}
