# AI-Core Architecture (Agent-Friendly)

This document provides a structural overview of the `@mars-memory/ai-core` package, designed specifically to help AI agents and human developers quickly orient themselves within the codebase.

## 1. Architectural Paradigm: Coordinator-Worker (DeepAgents)

The system is built on **DeepAgents**, utilizing a **Coordinator-Worker paradigm**. It has completely moved away from manual, procedural agent orchestration.

*   **Coordinator**: The central DeepAgent created via `createDeepAgent()`. It handles planning, task delegation, context summarization, and persistent state management.
*   **Workers (Subagents)**: 9 specialized domain experts (A1-A9), each equipped with specific LLM prompts and tools, invoked autonomously by the Coordinator.

```mermaid
graph TB
  ROUTE["API Route<br/>(External Trigger)"]
  DA["Coordinator DeepAgent<br/>(Orchestrator)"]
  TOOLS["Global Infra Tools<br/>(Database, Search, Status)"]
  
  subgraph Specialists [Domain Experts (Subagents)]
    A1["A1: Image Analyst<br/>(Computer Vision)"]
    A2["A2: Period Identifier<br/>(History Logic)"]
    A3["A3: Knowledge Retriever<br/>(RAG / Search)"]
    A4["A4: Schema Generator<br/>(JSON Mapping)"]
    A5["A5: Prompt Constructor<br/>(Prompt Eng.)"]
    A6["A6: Colorizer<br/>(Image Gen Sim)"]
    A7["A7: Post Processor<br/>(Image Tuning)"]
    A8["A8: Expert Reviewer<br/>(Quality Assurance)"]
    A9["A9: Output Compiler<br/>(Final Assembly)"]
  end

  ROUTE --> DA
  DA --> TOOLS
  DA -.->|Delegates Task & State| Specialists
```

## 2. Directory Structure & File Mapping

When making modifications, refer to this precise file mapping:

*   **`/src/orchestrator/index.ts`** 
    *   **Role**: **Control Plane**. 
    *   **What it does**: Initializes `createDeepAgent()`, registers Subagents A1-A9, injects Middleware (Summarization, Memory), and configures the `Checkpointer` (`MemorySaver`) for Thread state.
*   **`/src/tools/specialist.ts`** 
    *   **Role**: **Execution Plane**. 
    *   **What it does**: Contains the actual business logic, prompts, and LangChain `tool()` definitions for A1-A9. **If you need to change how an agent thinks or formats its output, edit here.**
*   **`/src/llm/index.ts`**
    *   **Role**: **Resource Allocation**.
    *   **What it does**: Standardizes LLM model initialization using LangChain's `initChatModel("provider:model")` and multi-modal message formatters.
*   **`/src/agents/index.ts`**
    *   **Role**: **Interface Definition**.
    *   **What it does**: Defines the `AgentTools` interface (the contract for DB/Storage dependencies injected from the outside app).

## 3. Four-Plane Dimensions

To adhere to standard architectural dimensions:

### A. Control Plane (Orchestration & Planning)
Managed entirely by `deepagents`. The Coordinator uses `write_todos` to autonomously plan the progression from A1 (Image Analysis) to A9 (Output Compilation). State is isolated per `jobId` mapped to LangGraph `thread_id`.

### B. Execution Plane (Workers)
Implemented in `/src/tools/specialist.ts`. Subagents do not execute arbitrarily; they are constrained by Zod schemas defined in their respective tools.

### C. Data Plane (State & Memory)
*   **Short-term / Episodic**: Handled by LangGraph Checkpointer (`MemorySaver`). Context overflow is prevented by `SummarizationMiddleware`.
*   **Long-term / Semantic**: Handled by `MemoryMiddleware`, which automatically parses Markdown knowledge sources (e.g., `/memories/uniform_knowledge.md`) into the Coordinator's context.

### D. Governance / Observation Plane
Job status updates (`update_job_status`) are executed as tools injected via `AgentTools`. Tracing is intrinsically supported through LangGraph's event stream.

## 4. Extension Guide for AI Agents

**Scenario 1: Adding a new Subagent (e.g., A10: Translator)**
1.  **Execution Plane**: Go to `src/tools/specialist.ts`. Create `createTranslatorTool(deps)`. Define its `systemPrompt`, `z.object` schema, and `invoke` logic. Export it in the factory.
2.  **Control Plane**: Go to `src/orchestrator/index.ts`. Add `{ name: "translator", description: "...", systemPrompt: "...", tools: [specialist.translator] }` to the `subagents` array.

**Scenario 2: Injecting a new Database Capability**
1.  **Interface**: Update `AgentTools` in `src/agents/index.ts` to include the new capability (e.g., `fetchUserProfile: () => Promise<User>`).
2.  **Implementation**: This package **does not** implement the DB call. Leave it to `apps/web` to pass the real function in `deps`.
3.  **Consumption**: Use `deps.infra.fetchUserProfile` inside a tool in `specialist.ts`.
