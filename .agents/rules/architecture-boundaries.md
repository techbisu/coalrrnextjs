# Clean Architecture Boundaries and Constraints

## 1. Domain Layer Strictness
- ALL business rules and structural invariants MUST live inside Domain Entities as rich behaviors (e.g., `lock()`, `calculate()`)[cite: 4, 5].
- YOU ARE STRICTLY FORBIDDEN from placing business rules inside application use cases or repositories[cite: 4, 5].

## 2. Persistence Layer Separation
- Direct database access via the Prisma instance (`db`) is STRICTLY PROHIBITED in the application layer or API routes[cite: 4, 5, 6].
- You MUST utilize the domain-defined interfaces (e.g., `IProjectRepository`) implemented inside `src/infrastructure/`[cite: 4, 5].

## 3. Error Handling Paradigm
- DO NOT use generic or unhandled `throw new Error()` statements.
- You MUST wrap calculation outputs and mutations inside the functional `Result<T, E>` pattern (`Ok()`, `Fail()`)[cite: 4, 5].