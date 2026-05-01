# apps/agent — Mode B: Standalone Agent Service

> **Status: Reserved for future deployment**
> This directory is intentionally minimal. Do not add production code here until Mode B migration is needed.

## What is this?

When the AI processing pipeline consistently exceeds Next.js serverless function time limits (~10s on Vercel), the Agent service is extracted here as an independent Node.js process.

## Migration from Mode A → Mode B

**Nothing in `packages/ai-core` changes.**

The only differences are:

| | Mode A (current) | Mode B (future) |
|---|---|---|
| Where Orchestrator runs | `apps/web/app/api/colorize/route.ts` | `apps/agent/src/server.ts` |
| How web calls it | Direct import | HTTP / WebSocket |
| Deployment | Vercel function | Fly.io / Railway / self-hosted |
| Time limit | ~10s | Unlimited |

## Planned Structure (Mode B)

```
apps/agent/
├── src/
│   ├── server.ts          ← Express/Fastify HTTP server
│   ├── routes/
│   │   └── colorize.ts    ← POST /colorize, GET /colorize/:jobId
│   └── worker.ts          ← Optional: BullMQ background worker
├── Dockerfile
└── package.json
```

## Environment Variables

Same as Mode A plus:
- `PORT` — HTTP port (default: 8080)
- `AGENT_SECRET` — Shared secret for web → agent authentication

## How to Start Mode B Migration

1. `cp apps/web/app/api/colorize/route.ts apps/agent/src/routes/colorize.ts`
2. Replace `NextRequest/NextResponse` with `express.Request/Response`
3. Update `apps/web/app/api/colorize/route.ts` to forward requests via HTTP
4. Deploy `apps/agent` independently

The Orchestrator import stays exactly the same:
```typescript
import { Orchestrator } from "@mars-memory/ai-core";
```
