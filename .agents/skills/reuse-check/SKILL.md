---
name: reuse-check
description: Use before creating any new function, component, service, or util
---
1. Run search_graph for the entity/feature name to find existing implementation
2. If found: extend/import it — stop, do not duplicate
3. If not found: proceed following architecture.md and package-first.md
4. Report explicitly: "Reusing: [X]" or "Nothing existing found, creating: [Y]"
