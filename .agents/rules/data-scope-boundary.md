# Data Scope Boundaries & User Scope Enforcement

## Core Requirements
1. **Active Scope Single Source of Truth**: User organizational scope is resolved dynamically from `user_org_scope` where `effective_to IS NULL`.
2. **Scope Hierarchy Levels**:
   - **`HQ`**: Full company-wide access across all Areas and Mines.
   - **`AREA`**: Restricted to all mines under `area_cd`.
   - **`UNIT`**: Restricted to `mine_cd` or proposals explicitly forwarded to that mine as a target recipient (`pr_scheme_ref_no` / `adjacent_mine_ids`).
3. **Mandatory Repository Usage**:
   - ALL database queries returning projects, land proposals, plot schedules, or compliance records MUST apply `UserScopeService.scopeToWhere(scope, 'area_cd', 'mine_cd')`.
   - Passes organizational filters + creator fallback (`entry_by = userId`) automatically.
4. **No Manual Filter Construction**:
   - NEVER construct raw inline `where: { area_cd: ... }` checks inside UseCases or API routes.
   - ALWAYS delegate to `UserScopeService`.
5. **Bidirectional Mine Adjacency**:
   - Adjacency is stored in `mine_master.adjacent_mine_ids`. Modifying an adjacent mine relationship syncs the array bidirectionally across both colliery master records.
