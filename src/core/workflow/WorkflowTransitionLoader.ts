/**
 * WorkflowTransitionLoader — loads the transition graph for a workflow
 * from the `workflow_transitions` DB table, Zod-validates each row,
 * and resolves guards by key from GUARD_REGISTRY.
 *
 * Caching: transitions are cached per workflow_code in globalThis with a
 * TTL (default 60 s). This prevents a DB query per engine call while still
 * allowing admins to add/deactivate transitions without a code deploy.
 * Cache is invalidated automatically after TTL — no manual flush needed.
 */
import 'server-only'
import { db } from "@/lib/db";
import { z } from "zod";
import { GUARD_REGISTRY } from "./guards";
import type { ActorRole, Transition } from "./types";

// ─── Zod schema — validates each DB row ─────────────────────────────────────

const DbTransitionSchema = z.object({
  transition_name: z.string().min(1),
  label:           z.string().min(1),
  from_state:      z.string().min(1),
  to_state:        z.string().min(1),
  required_role:   z.string().min(1),
  guard_key:       z.string().nullable(),
})

// ─── Cache ───────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = Number(process.env.WORKFLOW_TRANSITION_TTL_MS ?? 60_000)

interface CacheEntry {
  transitions: Transition[]
  expiresAt: number
}

const globalForWorkflow = globalThis as unknown as {
  _workflowTransitionCache: Map<string, CacheEntry> | undefined
}

function getCache(): Map<string, CacheEntry> {
  if (!globalForWorkflow._workflowTransitionCache) {
    globalForWorkflow._workflowTransitionCache = new Map()
  }
  return globalForWorkflow._workflowTransitionCache
}

// ─── Loader ──────────────────────────────────────────────────────────────────

/**
 * Load and cache the transition graph for `workflowCode`.
 * TypeScript state types are preserved — only the transition GRAPH is
 * runtime-configurable. Guards are still fully typed via GUARD_REGISTRY.
 */
export async function loadWorkflowTransitions(
  workflowCode: string
): Promise<Transition[]> {
  const cache = getCache()
  const cached = cache.get(workflowCode)

  if (cached && Date.now() < cached.expiresAt) {
    return cached.transitions
  }

  // Cache miss or expired — load from DB
  const rows = await (db as any).workflow_transitions.findMany({
    where: { workflow_code: workflowCode, is_active: true },
    orderBy: { sort_order: "asc" },
  })

  const transitions: Transition[] = rows.map((row: unknown) => {
    const parsed = DbTransitionSchema.parse(row)

    const guard = parsed.guard_key
      ? GUARD_REGISTRY[parsed.guard_key] ?? undefined
      : undefined

    if (parsed.guard_key && !guard) {
      console.warn(
        `[WorkflowTransitionLoader] Unknown guard_key "${parsed.guard_key}" ` +
        `for transition "${parsed.transition_name}" in workflow "${workflowCode}". ` +
        `Add it to GUARD_REGISTRY in guards.ts.`
      )
    }

    return {
      name:  parsed.transition_name,
      label: parsed.label,
      from:  parsed.from_state as any,
      to:    parsed.to_state as any,
      role:  parsed.required_role as ActorRole,
      guard,
    } satisfies Transition
  })

  cache.set(workflowCode, {
    transitions,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })

  return transitions
}

/** Force-invalidate the cache for a workflow — call after admin edits transitions. */
export function invalidateWorkflowCache(workflowCode?: string): void {
  const cache = getCache()
  if (workflowCode) {
    cache.delete(workflowCode)
  } else {
    cache.clear()
  }
}
