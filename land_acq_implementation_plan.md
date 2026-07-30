# Land Acquisition Orchestration Platform Implementation Plan

This plan details the architectural shift of the Land Acquisition module from a monolithic structure to an **event-driven orchestration model**. In this model, the Proposal module acts solely as an orchestrator, coordinating independent, reusable enterprise services (Workflow, Document, Checklist, Validation, GIS/LIS, Notifications).

## User Review Required
> [!IMPORTANT]
> - **Event-Driven Architecture**: This plan relies heavily on an Event Bus (e.g., publishing `PLOT_SCHEDULE_UPDATED`, `VALIDATION_FAILED`) to decouple modules. We must ensure the `EventBus` in `src/core/event-bus/` is robust enough to handle cross-module orchestration.
> - **Rule Engine Introduction**: Phase 4 & Exception Handling introduces a new `RuleEngine` to map validation results to actionable requirements (e.g., `Forest Plot` -> `Need Forest Clearance`). This prevents hardcoding business rules in the UI or Proposal entity.

## Open Questions
- **Event Bus Implementation**: Should the Event Bus use an in-memory dispatcher for Phase 1, or should we immediately integrate a message broker (like Redis/BullMQ, per `background-jobs.md`) for reliable cross-module event delivery?
- **Validation Engine**: Are the external systems for GIS and LIS validation currently mockable, or do we need to build placeholder simulators for development?

---

## Proposed Architecture: Module Breakdown

The monolithic "Land Acquisition" domain will be split into independent bounded contexts that plug into the common framework:

### 1. Proposal Management (Phase 1)
- **Role**: Lightweight orchestrator. Captures intent and tracks the aggregate state.
- **Data**: `acq_prop` (proposal_no, project_id, acquisition_mode, workflow_instance_id, status, created_by).
- **Behavior**: Starts workflows, reacts to domain events.

### 2. Plot Schedule Module (Phase 2)
- **Role**: Independent module for managing land plots, distinct from the proposal.
- **Data**: `plot_schedule`, `plot_schedule_item`, `plot_schedule_import_log`.
- **Behavior**: Handles manual entry, Excel/GIS imports, and duplicate detection.
- **Events Published**: `PLOT_SCHEDULE_CREATED`, `PLOT_ADDED`, `PLOT_UPDATED`.

### 3. Validation Engine (Phase 3)
- **Role**: Asynchronous validation of plots via Background Jobs.
- **Checks**: Duplicate Plot, Forest, CNT/SPT, Debottar, Area Overlap, LIS/GIS checks, Budget limits.
- **Output**: Produces a `ValidationResult` event payload without blocking the UI.

### 4. Compliance & Rule Engine (Phase 4 & Exception Handling)
- **Role**: Consumes `ValidationResult` events and dynamically generates `Requirements`.
- **Logic**: Evaluates rules (e.g., `If Forest Plot -> Emit FOREST_CLEARANCE_REQUIRED`).
- **Output**: Writes to the `checklist_requirement_rule` / `checklist_submission` engine.

### 5. Reusable Platform Integrations (Phases 5-10)
The Proposal orchestrator will trigger these existing/planned generic engines:
- **Checklist Engine (Phase 5)**: Reacts to `Requirements` dynamically. Renders required documents/actions (e.g., `Need District Judge`, `Need R&R`).
- **Document Engine (Phase 6)**: Proposal publishes `GenerateDocument(FORM_VII)`. Engine handles DOCX/PDF rendering, versioning, storage.
- **Workflow Engine (Phase 7)**: Proposal says `Start Workflow(CBA)`. Workflow Engine handles HQ/CMD/Board routing.
- **Digital Signature (Phase 8)**: Workflow requests `Sign Task`. Independent service handles PKI and hashing.
- **Notification Engine (Phase 9)**: Listens for events (`Proposal Returned`, `Validation Failed`) and dispatches Email/SMS.
- **Dashboard (Phase 10)**: CQRS Read Model. Projects events into view tables (e.g., `Proposal Count`, `Pending Area HQ`) for fast querying, never querying the transactional `acq_prop` directly.

---

## Development Roadmap & Execution Phases

We will execute this transformation in logical stages:

### Stage 1: Foundation (Current Priority)
- Refactor `acq_prop` to be a lightweight orchestrator entity.
- Ensure the `EventBus` is wired to the Proposal domain.
- Integrate the Workflow Engine (Proposal starts workflow via events).
- Integrate Audit and Notification baseline.

### Stage 2: Data Entry & Bounded Contexts
- Build the independent **Plot Schedule Module**.
- Implement Plot Schedule Grid, Master Lookups, and Excel Import.
- Wire `PLOT_SCHEDULE_UPDATED` events to trigger downstream engines.

### Stage 3: Validation & Rules (Async)
- Build the **Validation Engine** (Background jobs per `background-jobs.md`).
- Implement the **Rule Engine** to translate Validation Results into Compliance Actions.
- Implement Duplicate Detection and basic GIS/LIS mocks.

### Stage 4: Compliance & Document Vault
- Finalize the **Generic Checklist Engine** (from the previous plan).
- Wire the Rule Engine outputs to populate the Checklist.
- Implement the Document Vault UI for uploading/generating required compliance artifacts.

### Stage 5: Review & Enterprise Features
- Build the Screen 6 Split-Screen Reviewer (Docs + GIS + Plot History).
- Implement Digital Signatures.
- Enable advanced workflow routing (Board, Cross-colliery).

## Verification Plan
- **Architecture Validation**: Ensure no direct DB reads/writes between bounded contexts (e.g., Proposal should not directly update Plot Schedule tables; it must use services/events).
- **Background Jobs**: Verify that heavy validations (GIS/LIS) execute via `JobDispatcherService` and do not block the HTTP request.
- **UI Responsiveness**: Ensure the UI relies on websockets or polling to update when `ValidationResult` events complete in the background.
