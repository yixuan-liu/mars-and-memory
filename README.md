# Mars and Memory

An immersive, AI-driven interactive web experience powered by **Antigravity's Autonomous AI Developer Pipeline**. 

This repository has been uniquely structured to support a Zero-Code, AI-orchestrated development lifecycle. The root directory acts as the control center for an automated team of specialized AI Agents, while the actual application source code resides in an isolated build directory.

## 🏗 Repository Structure

```text
mars-and-memory/
├── .agents/                 # AI Orchestration Layer
│   ├── agents.md            # Defines the AI personas (@pm, @engineer, @qa, @devops)
│   ├── skills/              # Strict technical rules & tasks for each AI agent
│   └── workflows/           # Custom slash commands (e.g., /startcycle)
├── app_build/               # Application Source Code (Turborepo)
│   ├── apps/                # Next.js web application & mobile app
│   ├── packages/            # Shared AI core, DB clients, and UI components
│   └── package.json         # Workspace configuration
└── production_artifacts/    # AI-generated Technical Specifications
```

## 🤖 The Autonomous AI Pipeline

This project is built using an AI-first development workflow. Instead of writing code manually, you guide specialized AI agents through a continuous development cycle:

1. **Product Manager (@pm)**: Analyzes your ideas and writes robust technical specifications inside `production_artifacts/`. It waits for your explicit approval or inline rework comments.
2. **Full-Stack Engineer (@engineer)**: Translates the approved spec into code and scaffolds it directly into `app_build/`.
3. **QA Engineer (@qa)**: Audits the generated code, fixes logic breaks, and resolves missing dependencies.
4. **DevOps Master (@devops)**: Intelligently packages the app and runs the local development servers.

### How to use it

Trigger the entire automated pipeline directly inside your Antigravity IDE:
1. Open the Agent Manager chat.
2. Run the custom workflow command with your idea:
   ```bash
   /startcycle "I want to add a dark mode toggle to the top navigation bar."
   ```
3. Wait for the PM to generate the spec in `production_artifacts/Technical_Specification.md`.
4. Review the spec, add comments if necessary, and approve it.
5. Watch the AI team autonomously build, audit, and deploy your new feature!

## 💻 Manual Development

If you prefer to write code manually or run the application yourself, navigate to the `app_build/` directory.

```bash
cd app_build
pnpm install
pnpm run dev
```

For detailed architectural information on the application itself, refer to the code inside `app_build/packages/ai-core/`.
