---
name: impact-check
description: Use before editing any existing file with likely dependents
---
1. Run trace_path on the target file/symbol to find all references/dependents
2. List affected files to the user
3. Wait for confirmation before editing if the impact list is non-trivial (3+ files)
