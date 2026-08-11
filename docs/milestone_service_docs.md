# Milestones Service Layer Documentation

## 1. Overview & Purpose
The **Milestone Service** (`ManualMilestoneService`) is a dedicated service layer designed to track non-automated, real-world, and statutory milestones (e.g., government gazette notifications, physical possession handovers, manual board approvals) that occur outside the bounds of the automated digital workflow engine.

Its primary purpose is to provide an immutable, sequential audit trail of external legal and physical events that affect a proposal.

---

## 2. Core Entities

The service interacts directly with the following database tables:
- **`manual_milestone`**: Stores individual milestone records (e.g., Section 4 Notification, Sale Deed Registration) along with the authority involved, dates, outcomes, remarks, and any attached proof document IDs.
- **`deadline_tracker`**: A utility table designed to track deadlines associated with these milestones (to ensure legal compliance deadlines aren't missed).
- **`proposal_snapshot`**: Whenever a manual milestone is recorded against a proposal, a point-in-time snapshot of the proposal is captured for historical auditing.

---

## 3. Key Functionalities

### `recordMilestone(data: RecordMilestoneDTO)`
Records a new milestone against a specific entity. 
**Behavior:**
1. **Dependency Validation:** Checks `milestoneConfig` to ensure prerequisite milestones have been completed before the current one can be recorded.
2. **Persistence:** Saves the milestone record to the `manual_milestone` table.
3. **Snapshotting:** Automatically triggers `createProposalSnapshot` if the entity is a proposal, ensuring a historical freeze of the proposal's state at the exact moment the milestone occurred.
4. **Audit Logging:** Dispatches an event to the `auditQueue` (via `EventBus`) to maintain a system-wide log of the action.

### `getHistory(entityType, entityId)`
Retrieves a chronological list of all milestones recorded against an entity, sorted sequentially by the date the milestone occurred (`sent_at`).

---

## 4. Business Rules & Compliance (`milestone.config.ts`)

The service relies on a strict configuration file (`src/core/config/milestone.config.ts`) to enforce sequential dependencies. Milestones cannot be recorded out of order if a strict dependency chain is defined.

### 4.1. Direct Purchase (DP) Rules
For land acquired via Direct Purchase, the milestone dependencies are strictly enforced as follows:
- **`SALE_DEED_REGISTRATION`**: No prerequisites.
- **`STAMP_DUTY_CLEARANCE`**: Requires `SALE_DEED_REGISTRATION`.
- **`VALUATION_APPROVAL`**: No prerequisites.
- **`POSSESSION_HANDOVER`**: Requires **both** `SALE_DEED_REGISTRATION` and `STAMP_DUTY_CLEARANCE`.
- **`BOARD_SANCTION`**: No prerequisites.
- **`MUTATION_COMPLETED`**: Requires `POSSESSION_HANDOVER`.

### 4.2. Coal Bearing Areas (CBA) Act Rules
For statutory acquisition via the CBA Act, government gazette notifications must follow a rigid chronological sequence:
- **`SECTION_4_NOTIFICATION`**: (Intention to prospect) No prerequisites. *Triggers workflow transition `advance_to_sec7_prep`*.
- **`SECTION_7_NOTIFICATION`**: (Notice of intention to acquire) Requires `SECTION_4_NOTIFICATION`.
- **`SECTION_9_NOTIFICATION`**: (Declaration of acquisition) Requires `SECTION_7_NOTIFICATION`.
- **`SECTION_11_NOTIFICATION`**: (Vesting of land) Requires `SECTION_9_NOTIFICATION`.
- **`FORM_XXII_ISSUE`**: No prerequisites.

### 4.3. Role-Based Access Control (RBAC)
Only authenticated users with specific roles or permissions can interact with the Milestone Service. The allowed roles defined globally are:
`['admin', 'super_admin', 'area_gm', 'unit_office', 'legal_officer']`.

---

## 5. Typical Use Cases

1. **Recording Legal Gazette Notifications:** A Legal Officer receives a physical gazette notification from the Ministry of Coal that Section 9 has been published. They upload the PDF to the system and use the Milestone Service to record the `SECTION_9_NOTIFICATION`, linking the uploaded document ID.
2. **Physical Possession:** The Unit Office takes physical possession of purchased land. They record `POSSESSION_HANDOVER`, but the Milestone Service will reject the entry if the system shows that the `SALE_DEED_REGISTRATION` milestone hasn't been recorded yet.
3. **Auditing and Snapshots:** A dispute arises over what the proposal's estimated costs were at the time of the Section 4 notification. The system can look up the `proposal_snapshot` generated automatically by the Milestone Service at the exact moment the Section 4 milestone was recorded.
