import type { ColorComponent, UniformSchema } from "@mars-memory/types";

// ==========================================
// Memory Layer
// Three-tier memory system from architecture.md §2.1
// All implementations are platform-agnostic (no DOM, no browser APIs).
// ==========================================

// ---- Base interface ----

export interface MemoryStore {
  /** Persist a value under a key */
  set(key: string, value: unknown): Promise<void>;
  /** Retrieve a value; returns undefined if not found */
  get<T = unknown>(key: string): Promise<T | undefined>;
  /** Delete a key */
  delete(key: string): Promise<void>;
}

// ---- In-process Map store (for development / testing) ----

export class InMemoryStore implements MemoryStore {
  private readonly store = new Map<string, unknown>();

  async set(key: string, value: unknown) { this.store.set(key, value); }
  async get<T>(key: string) { return this.store.get(key) as T | undefined; }
  async delete(key: string) { this.store.delete(key); }
}

// ---- Episodic Memory ----
// Records the per-job execution history (what happened, in what order).
// In production, back this with a Supabase table or Redis.

export interface EpisodicEntry {
  jobId: string;
  agentName: string;
  timestamp: string;
  summary: string;
  payload?: unknown;
}

export class EpisodicMemory {
  constructor(private readonly store: MemoryStore) {}

  async record(entry: EpisodicEntry): Promise<void> {
    const key = `episodic:${entry.jobId}`;
    const existing = (await this.store.get<EpisodicEntry[]>(key)) ?? [];
    await this.store.set(key, [...existing, entry]);
  }

  async getHistory(jobId: string): Promise<EpisodicEntry[]> {
    return (await this.store.get<EpisodicEntry[]>(`episodic:${jobId}`)) ?? [];
  }
}


