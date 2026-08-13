# Milestones Service Layer Documentation

## 1. Overview & Purpose
The **Milestone Service** (`ManualMilestoneService`) is a dedicated service layer designed to track non-automated, real-world, and statutory milestones (e.g., government gazette notifications, physical possession handovers, manual board approvals) that occur outside the bounds of the automated digital workflow engine.

Its primary purpose is to provide an immutable, sequential audit trail of external legal and physical events that affect a proposal.

---

## 2. Core Entities

The service is fully database-driven and interacts directly with the following tables:
- **`milestone_definition`**: Stores the catalogue of possible milestones per module (`module_code`, `entity_type`, `name`).
- **`milestone_dependency`**: Stores the required sequence (prerequisites) between milestones.
- **`manual_milestone`**: Stores the actual user submissions (e.g., Section 4 recorded on a specific date).
- **`deadline_tracker`**: A utility table designed to track deadlines associated with these milestones.
- **`proposal_snapshot`**: Whenever a manual milestone is recorded against a proposal, a point-in-time snapshot of the proposal is captured for historical auditing.

---

## 3. Key Functionalities

### `recordMilestone(data: RecordMilestoneDTO)`
Records a new milestone against a specific entity. 
**Behavior:**
1. **Dependency Validation:** Queries `milestone_dependency` table to ensure any `REQUIRED` prerequisite milestones have been completed in `manual_milestone` before the current one can be recorded.
2. **Persistence:** Saves the milestone record to the `manual_milestone` table.
3. **Snapshotting:** Automatically triggers `createProposalSnapshot` (via workflow reactions) if the entity is a proposal.
4. **Audit Logging:** Dispatches an event to the `auditQueue` (via `EventBus`) to maintain a system-wide log of the action.

### `getDefinitionsForModule(moduleCode, entityType?)`
Loads the dynamic configuration from the DB for rendering the UI. Used by the `GET /api/milestones/definitions` endpoint to feed the `ManualMilestonePanel` without any hardcoded TypeScript config.

### `getHistory(entityType, entityId)`
Retrieves a chronological list of all milestones recorded against an entity, sorted sequentially by the date the milestone occurred (`sent_at`).

---

## 4. Business Rules & Compliance (100% DB-Driven)

The service relies on the DB tables (`milestone_definition` and `milestone_dependency`) to enforce sequential dependencies. Milestones cannot be recorded out of order if a strict dependency chain is defined.

**Zero TypeScript changes are required to add a new module's milestone flow.**

### Dependency Patterns
- **Hard Block (`is_required = true`)**: The service rejects the insertion and returns a `Fail()` result if the prerequisite is missing.
- **Soft Warning (`is_required = false, condition_type = 'RECOMMENDED'`)**: The service allows the insertion but logs a warning.

### Role-Based Access Control (RBAC)
Only authenticated users with specific roles or permissions can interact with the Milestone Service.

---

## 5. Typical Use Cases

1. **Recording Legal Gazette Notifications:** A Legal Officer receives a physical gazette notification from the Ministry of Coal that Section 9 has been published. They upload the PDF to the system and use the Milestone Service to record the `SECTION_9_NOTIFICATION`, linking the uploaded document ID.
2. **Physical Possession:** The Unit Office takes physical possession of purchased land. They record `POSSESSION_HANDOVER`, but the Milestone Service will reject the entry if the `milestone_dependency` graph states that the `SALE_DEED_REGISTRATION` milestone hasn't been recorded yet.
3. **Auditing and Snapshots:** A dispute arises over what the proposal's estimated costs were at the time of the Section 4 notification. The system can look up the `proposal_snapshot` generated automatically by the Milestone Service at the exact moment the Section 4 milestone was recorded.
