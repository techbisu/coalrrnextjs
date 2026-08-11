import { Result, Ok, Fail } from '@/core';
import { ChecklistContext } from '../interfaces/IChecklistContextProvider';

export class ChecklistFreshnessService {
  /**
   * Validates whether calculated checklist context version matches entity version.
   */
  evaluateFreshness(context: ChecklistContext): Result<{ isFresh: boolean; reason?: string }> {
    if (!context) {
      return Ok({ isFresh: false, reason: 'Checklist context is missing' });
    }

    if (context.isStale || context.contextVersion < context.entityVersion) {
      return Ok({
        isFresh: false,
        reason: `Checklist context (v${context.contextVersion}) is stale compared to entity (v${context.entityVersion}). Re-evaluation required.`,
      });
    }

    return Ok({ isFresh: true });
  }
}

export const checklistFreshnessService = new ChecklistFreshnessService();
