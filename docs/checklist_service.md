# Checklist Service Module

The Checklist Service Module is a shared, enterprise-grade generic service designed to evaluate dynamic rules, handle cross-entity inheritance, and securely store compliance inputs (e.g., land acquisition stages, employment application requirements) across the entire system.

## Architecture & How It Works

The service operates on three core principles:

1. **Context Resolution (`ChecklistContextRegistry`)**
   The service uses a registry pattern to decouple the checklist logic from the domain models. When evaluating rules for a given entity (e.g., a `proposal` or a `project`), the service fetches the entity's current state via a registered **Context Resolver** rather than querying the database directly. 
   
2. **Dynamic Rule Evaluation (`show_if`)**
   Checklist items can be configured in the database to conditionally appear based on the state of the entity (the context). For example, a "Forest Clearance" checklist item might only appear if `context.land_type === 'Forest'`.

3. **Auto-Inheritance & Bi-Directional Sync (`inherit_from`, `sync_to_parent`)**
   - **Inheritance:** A child entity (e.g., a `Plot`) can automatically inherit checklist completion status from its parent (e.g., the `Proposal`) if configured via `inherit_from`.
   - **Sync to Parent:** A submission against a child entity can be intercepted and stored against the parent entity if `sync_to_parent` is configured on the rule.

---

## Core Components

- **Validation:** All inputs must pass through `ChecklistQuerySchema` or `UpdateSubmissionSchema` located in `src/core/validation/schemas/checklist.schema.ts`.
- **Use Cases:**
  - `GetChecklistStatusUseCase`: Evaluates the context, runs the rules, and computes the current progress.
  - `UpdateChecklistSubmissionUseCase`: Handles the insertion of checklist completions and handles bi-directional syncing.

---

## Example Usage

### 1. Registering a Context Resolver
Before a module can use the checklist, it must register a resolver in the central registry (usually done in `src/infrastructure/di/Container.ts`).

```typescript
import { ChecklistContextRegistry, IContextResolver } from '@/core/checklist/registry/ChecklistContextRegistry';

class ProposalContextResolver implements IContextResolver {
  async resolve(checkableId: string): Promise<Record<string, any>> {
    const proposal = await db.acq_proposal.findUnique({ where: { proposal_id: checkableId } });
    return {
      acquisition_mode: proposal.acq_mode_id,
      state: proposal.current_stage_cd,
      is_forest_land: true // example computed field
    };
  }
}

// In your DI container setup:
const checklistRegistry = new ChecklistContextRegistry();
checklistRegistry.register('PROPOSAL', new ProposalContextResolver());
```

### 2. Fetching Checklist Status in a Server Component
You can interact directly with the Server Action to retrieve the dynamically computed checklist for a given entity.

```typescript
import { getChecklistStatus } from '@/app/actions/checklist.actions';

export default async function ProposalChecklistPage({ params }: { params: { id: string } }) {
  // Fetch checklist specifically configured for 'PROPOSAL' module and this specific ID
  const status = await getChecklistStatus('PROPOSAL', 'acq_proposal', params.id);

  return (
    <div>
      <h2>Checklist Status</h2>
      {status.isComplete ? <Badge>Complete</Badge> : <Badge>Pending</Badge>}
      
      <ul>
        {status.items.map(item => (
          <li key={item.ruleId}>
            {item.title} - {item.submission ? '✅ Done' : '❌ Pending'}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 3. Updating a Submission (Client-Side Action)
When a user uploads a document or ticks a checkbox to satisfy a rule, call the update action.

```typescript
'use client';

import { updateChecklistSubmission } from '@/app/actions/checklist.actions';

export function CompleteRequirementButton({ requirementId, proposalId }) {
  const handleComplete = async () => {
    await updateChecklistSubmission({
      moduleCode: 'PROPOSAL',
      requirementId: requirementId,
      checkableType: 'acq_proposal',
      checkableId: proposalId,
      userInput: { confirmed: true }
    });
    // Refresh router or local state
  };

  return <button onClick={handleComplete}>Mark Complete</button>;
}
```

## Developer Guidelines
1. **Never bypass the Use Cases:** Always use `GetChecklistStatusUseCase` or `UpdateChecklistSubmissionUseCase` to interact with checklist data, as raw DB queries will miss context resolution and inheritance logic.
2. **Authorization Context:** The generic server actions do not enforce strict domain-level RBAC internally (as they are shared). Ensure that the UI invoking the actions is properly gated, or inject domain-specific validation into your custom resolvers.
