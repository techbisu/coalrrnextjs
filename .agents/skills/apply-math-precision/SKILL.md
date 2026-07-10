---
name: apply-math-precision
description: Validates and writes calculations involving currency, money or fractional land areas.
triggers: ["calculate award", "math engine", "solatium", "escalation", "add money field"]
---
# Skill: Financial Precision Compliance

## Mandatory Rules
- NEVER use JavaScript/TypeScript floats or doubles for currency or acreage math[cite: 3].
- All monetary metrics must map to the custom `Money` Value Object backed by arbitrary-precision decimals[cite: 4, 5].
- All fields writing back to the persistence layer must be verified through custom cast configurations[cite: 3].

## Code Pattern Template
```typescript
const input = new CompensationInput({
  landValue: Money.fromINR(request.value),
  multiplicationFactor: "2.00"
});

---

## 5. Operational Verification Workflow

Once these guardrails, rules, and skills are deployed, execute your alignment loop using Antigravity's interactive terminal interface:

```bash
# Teach Antigravity to parse and index your newly declared boundaries
antigravity index --workspace=. --rules=.agents/rules --skills=.agents/skills

# Validate the model's alignment against a dry-run implementation
antigravity plan "Create a LockProjectUseCase inside the application layer"