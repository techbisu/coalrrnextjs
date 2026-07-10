---
name: generate-use-case
description: Generates a Clean Architecture Use Case class under the application layer orchestrating domain logic.
triggers: ["create use case", "add new business operation", "add use-case"]
---
# Skill: Generate Clean Use Case

## Step-by-Step Execution Blueprint
1. Locate the core domain aggregate inside `src/domain/` to verify target behavior exists[cite: 6].
2. Create a type-safe input DTO request mapping validation rules to Zod schemas in `src/application/validators/`.
3. Formulate the Use Case implementing the `IUseCase<TRequest, TResponse>` contract[cite: 4, 5].
4. Orchestrate persistence entirely through the abstract interface repository layer[cite: 4, 5].
5. Clear domain events from the entity root and forward them to the system `EventBus`[cite: 2, 5].

## Verification Gate
Before declaring success, run:
```bash
npx vitest run tests/unit/application/