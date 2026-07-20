# Data Scope Boundaries

1. **Active Scope**: A user has only ONE active scope at a time (`effective_to IS NULL`).
2. **Levels**: HQ, AREA, UNIT.
3. **visibilityWhere**: All data queries must pass through `UserScopeService.visibilityWhere()` to append the organizational filtering + personal creator/approver fallback.
4. **Mine Adjacency**: Adjacency is a bidirectional array of `mine_cd`s on the `mine_master`. Modifying it fires a trigger to sync the array in both directions.
5. **No Ad Hoc Wheres**: Do not build scope filters manually in use cases. Pass the filter down to repositories from the helper.
