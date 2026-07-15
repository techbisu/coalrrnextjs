---
name: build-check
description: MUST run before writing any new function, service, or UI component
---
1. search_graph for existing implementation (reuse-check)
2. If UI: check src/ui/components/ + shadcn availability before building custom
3. If logic/service: check package.json + npm registry for an existing maintained package
4. Report explicitly: "Reusing: [X]" or "New package: [Y], reason: [Z]" or
   "Custom build, reason: [no package/component fits because...]"
5. Never proceed to code without completing 1–4
