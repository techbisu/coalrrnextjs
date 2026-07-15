# Optimization & Structure-First Thinking

Before implementing, briefly reason through:
1. Does this fit the existing pattern (Project module) — if yes, mirror it exactly
2. Is there N+1 query risk? Use Prisma `include`/`select` properly, not loops of queries
3. Is this reusable elsewhere? If yes, put it in a shared service, not module-local
4. Does UI need memoization/pagination for lists? Check existing table pattern first

State the approach in 1-2 lines before coding, not after.
