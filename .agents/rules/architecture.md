# Architecture Rules

## Layer flow (mandatory, never skip a layer)
Entity (domain) → Repository interface (domain) → PrismaRepository (infrastructure)
→ UseCase (application) → API route (app) → UI component (ui)

## SOLID enforcement
- Single Responsibility: one class/function does one thing — split if a file does 2+ jobs
- Open/Closed: extend via new UseCase/Repository implementations, don't modify shared core logic
- Liskov: repository implementations must fully satisfy their interface contract
- Interface Segregation: small, focused repository interfaces — no god-interfaces
- Dependency Inversion: UseCases depend on repository INTERFACES (domain), never on
  PrismaRepository (infrastructure) directly

## Use Case location (both valid, pick per scope)
- Cross-cutting/shared Use Case → src/application/use-cases/
- Module-specific Use Case → src/modules/<module>/application/use-cases/
Match whichever pattern the module already uses — check with search_graph first.

## Rules
- No business logic in API routes or UI components — routes only call UseCases
- No new UI components — reuse src/ui/components/* only (see ui-consistency.md)
- All mutations return Result<T,E>, never throw in domain/application layers
- Before building a new module, mirror the exact pattern of the Project module
  (already the reference implementation in this repo)
