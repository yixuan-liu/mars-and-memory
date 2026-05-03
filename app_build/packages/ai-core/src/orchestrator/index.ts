import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { createDeepAgent, StateBackend, createSummarizationMiddleware, createMemoryMiddleware } from "deepagents";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import type { AgentTools } from "../agents/index.js";
import { createAllSpecialistTools } from "../tools/specialist.js";
import type { ColorizeRequest, AgentStep } from "@mars-memory/types";

// ==========================================
// Orchestrator — Coordinator-Worker via DeepAgents
//
// GAP 1 FIX: All 9 specialist agents are now registered as subagents.
// The coordinator autonomously delegates tasks using the built-in `task` tool.
// No more manual sequential function calls.
//
// Architecture (per DeepAgents docs):
//   Coordinator (this) ──delegate──► image_analyst subagent
//                       ──delegate──► period_identifier subagent
//                       ──delegate──► knowledge_retriever subagent
//                       ──delegate──► schema_generator subagent
//                       ──delegate──► prompt_constructor subagent (stub)
//                       ──delegate──► colorizer subagent (stub)
//                       ──delegate──► post_processor subagent (stub)
//                       ──delegate──► expert_reviewer subagent
//                       ──delegate──► output_compiler subagent (stub)
// ==========================================

export interface OrchestratorOptions {
  /** LangChain chat model — created via createChatModel() */
  llm: BaseChatModel;
  tools: AgentTools;
}

export interface OrchestratorRunOptions {
  jobId: string;
  request: ColorizeRequest;
}

export interface OrchestratorResult {
  jobId: string;
  success: boolean;
  outputImageUrl?: string;
  overallConfidence?: number;
  agentTrace: AgentStep[];
  error?: string;
}

// ==========================================
// System prompt — teaches the coordinator how to use subagents
// ==========================================

const ORCHESTRATOR_SYSTEM_PROMPT = `You are the Orchestrator for the MilitaryHistoryVision system — an AI pipeline that colorizes black-and-white historical military uniform photographs.

You have access to specialist subagents. Delegate work to them in the correct sequence:

1. **image_analyst** — Analyze the photograph to describe the uniform in detail.
2. **period_identifier** — Determine country, branch, period, and rank from the description.
3. **knowledge_retriever** — Search the knowledge base for matching uniform color schemas.
4. **schema_generator** — Generate a complete UniformSchema with color mappings.
5. **expert_reviewer** — Validate the schema for historical accuracy.

After each subagent completes, review its output and pass relevant data to the next.
Use the update_job_status tool to track pipeline progress.
Use save_results to persist the final reviewed schema.

Important rules:
- Always delegate to the appropriate subagent — do NOT try to do their work yourself.
- Pass the previous subagent's output as context to the next subagent.
- If a subagent reports low confidence (<0.6), note this in your final report.`;

export class Orchestrator {
  private readonly llm: BaseChatModel;
  private readonly tools: AgentTools;
  // Shared checkpointer instance to persist state across invocations/threads
  private readonly checkpointer = new MemorySaver();

  constructor(options: OrchestratorOptions) {
    this.llm = options.llm;
    this.tools = options.tools;
  }

  async run(options: OrchestratorRunOptions): Promise<OrchestratorResult> {
    const { jobId, request } = options;
    const startedAt = new Date().toISOString();

    try {
      // Create specialist tools with captured dependencies
      const specialist = createAllSpecialistTools({
        llm: this.llm,
        infra: this.tools,
      });

      // Build the coordinator DeepAgent with all 9 subagents
      const coordinator = createDeepAgent({
        model: this.llm,
        backend: new StateBackend(),
        checkpointer: this.checkpointer,
        middleware: [
          createSummarizationMiddleware({
            model: this.llm,
            backend: new StateBackend(),
          }),
          createMemoryMiddleware({
            backend: new StateBackend(),
            sources: ["/memories/uniform_knowledge.md"],
          }),
        ],

        // Coordinator-level tools (status tracking, result persistence)
        tools: [
          specialist.updateStatus,
          specialist.saveResults,
        ],

        // Each specialist agent is a subagent with its own tools
        subagents: [
          {
            name: "image_analyst",
            description: "Expert at analyzing black-and-white military photographs. Identifies uniform details, visible features, and image quality using computer vision.",
            systemPrompt: "You are an expert military uniform historian with computer vision capabilities. Use the analyze_photograph tool to examine images. Always return detailed, structured analysis.",
            tools: [specialist.analyzePhotograph],
          },
          {
            name: "period_identifier",
            description: "Military history specialist who identifies the country, branch, time period, and rank from a uniform description.",
            systemPrompt: "You are a military history expert specialising in identifying uniform periods, countries, and ranks. Use the identify_period tool with the uniform description provided. Be precise about date ranges.",
            tools: [specialist.identifyPeriod],
          },
          {
            name: "knowledge_retriever",
            description: "Searches the military uniform knowledge base to find matching historical color schemas for a given uniform specification.",
            systemPrompt: "You are a research specialist who searches the uniform knowledge base. Use the retrieve_uniform_knowledge tool to find relevant color schemas. Construct precise search queries from the period, country, branch, and rank.",
            tools: [specialist.retrieveKnowledge],
          },
          {
            name: "schema_generator",
            description: "Generates a complete UniformSchema with historically accurate color mappings for each uniform component, using retrieved knowledge as reference.",
            systemPrompt: "You are a uniform colorization specialist. Use the generate_uniform_schema tool to create precise color mappings for each uniform component. Cross-reference with any retrieved schemas for accuracy.",
            tools: [specialist.generateSchema],
          },
          {
            name: "prompt_constructor",
            description: "Constructs optimized colorization prompts for the image generation model based on the UniformSchema.",
            systemPrompt: "You are a prompt engineering expert. Use the construct_colorization_prompt tool to create a highly detailed Stable Diffusion/Midjourney prompt based on the UniformSchema.",
            tools: [specialist.constructPrompt],
          },
          {
            name: "colorizer",
            description: "Applies historically accurate colors to the black-and-white photograph using the constructed prompt.",
            systemPrompt: "You are an AI colorization agent. Use the colorize_image tool to apply the generated prompt to the original image.",
            tools: [specialist.colorizeImage],
          },
          {
            name: "post_processor",
            description: "Post-processes the colorized image for quality — adjusts color balance, removes artifacts, and enhances detail.",
            systemPrompt: "You are an image post-processing expert. Use the post_process_image tool to finalize the colorized image.",
            tools: [specialist.postProcessImage],
          },
          {
            name: "expert_reviewer",
            description: "Senior military historian who reviews the generated UniformSchema for historical accuracy, flagging errors and suggesting corrections.",
            systemPrompt: "You are a senior military historian who reviews uniform color schemas. Use the review_schema_accuracy tool to validate schemas. Flag any historical inaccuracies and suggest corrections with confidence scores.",
            tools: [specialist.reviewSchema],
          },
          {
            name: "output_compiler",
            description: "Compiles the final output package with the colorized image, schema, confidence scores, and source attributions.",
            systemPrompt: "You compile the final output package for the user. Use the compile_output tool to format the results into a final readable report.",
            tools: [specialist.compileOutput],
          },
        ],

        systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT,
      });

      // Build the image reference for the coordinator
      const imageRef = request.image.type === "url"
        ? request.image.url
        : `data:${request.image.mimeType};base64,${request.image.data}`;

      const hintsText = request.hints
        ? `\n\nUser-provided hints: ${JSON.stringify(request.hints)}`
        : "";

      // Invoke the coordinator — it will autonomously delegate to subagents
      const result = await coordinator.invoke(
        {
          messages: [{
            role: "user",
            content: `Colorize this military photograph.\n\nJob ID: ${jobId}\nImage URL: ${imageRef}${hintsText}\n\nPlease coordinate the full pipeline: analyze → identify → retrieve → generate schema → review → save results.`,
          }],
        },
        { configurable: { thread_id: jobId } }
      );

      const completedAt = new Date().toISOString();

      // Extract trace from the coordinator result
      const agentTrace: AgentStep[] = [{
        agentName: "Coordinator",
        startedAt,
        completedAt,
        result,
      }];

      return {
        jobId,
        success: true,
        agentTrace,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      await this.tools.updateJobStatus?.(jobId, "failed");
      return {
        jobId,
        success: false,
        agentTrace: [{
          agentName: "Coordinator",
          startedAt,
          completedAt: new Date().toISOString(),
          result: null,
          error,
        }],
        error,
      };
    }
  }
}
