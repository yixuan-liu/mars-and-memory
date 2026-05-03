# Mars and Memory

An immersive, AI-driven interactive web experience. This project combines a "scrollytelling" frontend journey (using Next.js and Framer Motion) with an advanced **DeepAgents** AI backend. The AI pipeline operates as a Coordinator-Worker system, autonomously analyzing, dating, and historically colorizing black-and-white military photographs.

This repository is structured as a **Turborepo Monorepo** to facilitate code sharing across platforms and strict separation between the AI layer and the web app.

## 🏗 Repository Structure

```text
mars-and-memory/
├── apps/
│   ├── web/       # Next.js web application (Frontend & API Routes)
│   ├── mobile/    # React Native / Expo mobile application
│   └── docs/      # Nextra documentation site
├── packages/
│   ├── ai-core/   # 🧠 DeepAgents Coordinator-Worker architecture & Specialist subagents
│   ├── api/       # API client (fetch + Zod)
│   ├── config/    # Shared configurations (ESLint, TS, etc.)
│   ├── db/        # Supabase client wrapper and database types
│   ├── types/     # Shared Zod schemas and TypeScript definitions
│   └── ui/        # Shared platform-aware React components
```

## ✨ Features

- **Autonomous AI Colorization Pipeline (`ai-core`):** A robust multi-agent system powered by DeepAgents. A central Coordinator delegates tasks to 9 domain-specialist Subagents (Image Analysts, Historians, Prompt Engineers, etc.) to historically restore black-and-white photos.
- **Stateful AI Sessions:** Built-in Checkpointers (LangGraph `MemorySaver`) and Middlewares for context summarization and persistent thread recovery.
- **Scroll-Driven Narrative:** Uses Framer Motion's `useScroll` and `useTransform` to map scroll progress to CSS properties.
- **Deep-Zoom Panning:** Specialized components allow zooming and panning across high-res historical artifacts.
- **Monorepo Architecture:** Clean separation of concerns with shared UI, types, and standalone AI packages.

## 🛠 Tech Stack

- **Framework:** Next.js (App Router), React Native
- **AI / Agents:** [DeepAgents](https://docs.langchain.com/oss/javascript/deepagents/overview), LangGraph, LangChain
- **Monorepo Tooling:** Turborepo, pnpm workspaces
- **Language & Validation:** TypeScript, Zod
- **Animation:** Framer Motion
- **Styling:** Tailwind CSS

## 🚀 Getting Started

This project STRICTLY uses `pnpm` as its package manager.

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start the development server:**
   ```bash
   pnpm run dev
   ```

3. **Other Useful Commands:**
   ```bash
   pnpm run build       # Build all apps and packages
   pnpm run lint        # Run linting across the monorepo
   pnpm run type-check  # Run type checking
   ```

For detailed AI architecture documentation, see [`packages/ai-core/docs/architecture.md`](packages/ai-core/docs/architecture.md).
