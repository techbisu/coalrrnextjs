# Land Acquisition Module Configuration & Multi-Role UI Testing Guide

> **Goal**: Complete guide for configuring a module (Land Acquisition) in the Generic Process Platform and testing end-to-end workflows across multiple user roles in the application UI.

---

## Part 1: Service Configuration Architecture

Every module configured in the Process Platform follows 3 declarative configuration steps:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. MODULE SELF-REGISTRATION IN DI CONTAINER (proposal.di.ts)                           │
│    Registers processCode, moduleCode, checklistResolver, and GUARD_REGISTRY            │
└────────────────────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. DATABASE RULE CONFIGURATION (SQL / Seed Data)                                       │
│    - workflow_states: State catalogue & linear order                                   │
│    - workflow_transitions: Transition graph, role access, and guard keys               │
│    - workflow_reaction: Decoupled event triggers (e.g., milestone ➔ state advance)     │
└────────────────────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 3. STREAMLINED 4-COMPONENT UI SHELL MOUNTING                                           │
│    - ProcessActionCenter (Header command banner with role-filtered buttons)             │
│    - UnifiedWorkflowTimeline (Horizontal stepper + unified audit feed)                 │
│    - SmartChecklistWorkspace (Dynamic rule validation & document triggers)             │
│    - ManualMilestonePanel (Statutory gazette & possession milestone log)                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 2: Step-by-Step Multi-Role UI Testing Walkthrough

### 1. User Roles in Land Acquisition Workflow

| Role Code | User Role | Primary Responsibilities & UI View |
|---|---|---|
| `unit_office` | Unit Office / Colliery Surveyor | Drafts proposal, attaches plots, satisfies CL-1 checklist, submits for verification. |
| `area_office` | Area Land Officer / Area GM | Reviews plot limits against project baseline (`LimitCheckPanel`), approves/returns proposal. |
| `gm_planning` | HQ GM Planning | Conducts parallel technical vetting (part of `HqParallelVetting` stage). |
| `gm_finance` | HQ GM Finance | Conducts parallel financial/budget clearance. |
| `gm_safety` | HQ GM Safety | Conducts parallel safety clearance. |
| `hod_legal` | HQ HOD Legal | Conducts parallel legal scrutiny and Form-VII/XXII document verification. |
| `gm_lre` | GM Land & Estate | Consolidates parallel clearances, issues docket, completes final publication approval. |

---

### 2. Multi-Role Testing Scenario (Step-by-Step)

#### Step 1: Login as `Unit Office` (`unit_office`)
1. Open application at `http://localhost:3000/proposals`.
2. Click **Create New Proposal** (or open an existing draft proposal).
3. **Inspect `<ProcessActionCenter />`**:
   - Current stage: **`Drafting`**.
   - Active Role Scope: `unit_office`.
   - Action Required: *Complete Compliance Checklist (Mandatory Pending)*.
4. **Complete Checklist**:
   - Switch to **Compliance Checklist** tab.
   - Fill in mandatory fields (e.g. Mouza Name, Plot Schedule, Verification Date).
   - Generate required forms (e.g. Form-I, Form-VII).
5. **Forward Proposal**:
   - Notice the Action Center button turns green: **Submit to Area Office**.
   - Click **Submit to Area Office**. Fill in justification note in the modal.
   - **Observe UI Auto-Refresh**: The stage advances to `UnitSubmitted` / `AreaVetting`, and a new green event entry appears immediately in `<UnifiedWorkflowTimeline />`.

---

#### Step 2: Switch Role to `Area Office` (`area_office`)
1. Open the proposal detail view as an **Area Land Officer**.
2. **Inspect `<ProcessActionCenter />`**:
   - Current stage: **`AreaVetting`**.
   - Available Action: **Submit for HQ Parallel Vetting** or **Return to Unit Office**.
3. **Test Prerequisite Guard Tooltip**:
   - If land area/budget exceeds baseline limit, hover over **Submit for HQ Parallel Vetting**.
   - Notice the button is disabled with a red tooltip: *Prerequisite Incomplete: Land area breaches baseline limit. Must escalate to Board.*
4. Click **Submit for HQ Parallel Vetting**.
   - State advances to **`HqParallelVetting`**.

---

#### Step 3: Test HQ Parallel Vetting (`gm_planning`, `gm_finance`, `gm_safety`, `hod_legal`)
1. Open proposal as **GM Planning** $\rightarrow$ Click **Recommend Approval**.
2. Notice in `<UnifiedWorkflowTimeline />` under **Parallel Review Branches Status**:
   - `GM Planning: Recommended` (Green)
   - `GM Finance: Awaiting` (Yellow)
   - `GM Safety: Awaiting` (Yellow)
   - `HOD Legal: Awaiting` (Yellow)
3. Open as **GM Finance**, **GM Safety**, and **HOD Legal** $\rightarrow$ Recommend Approval for each.
4. Once all 4 branches complete, the workflow engine automatically advances the stage to **`GmLreReview`**.

---

#### Step 4: Test Decoupled Statutory Milestone Reaction (`SECTION_4_NOTIFICATION`)
1. Open proposal as **GM (LRE)** / **Legal Officer**.
2. Go to **Statutory Milestones** tab (`<ManualMilestonePanel />`).
3. Click **Add Milestone** $\rightarrow$ Select **Section 4 Gazette Notification** $\rightarrow$ Fill gazette reference number $\rightarrow$ Save.
4. **Observe Decoupled Reaction**:
   - The milestone is recorded in `manual_milestone`.
   - `ManualMilestoneService` emits `milestone_recorded` event.
   - `WorkflowReactionService` receives the event and automatically triggers the transition to **`Sec7Preparation`**.
   - `<UnifiedWorkflowTimeline />` updates with both the milestone record and the automated state advance.

---

#### Step 5: Test Non-Destructive Document Regeneration (Single File Record Rule)
1. In the **Compliance Checklist** tab, click **Regenerate Form-VII**.
2. `DocumentVersionService` creates **Version 2** as `DRAFT`, while Version 1 is marked **`SUPERSEDED`**.
3. Open the document workspace: previous signatures on Version 1 are safely preserved in audit history, while Version 2 prompts for fresh signatures.
