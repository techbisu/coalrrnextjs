# UI/UX Consistency Rule

## ui-ux-pro-max-skill usage (design system generator — installed)
- Generate the design system ONCE for the whole app, not per page/module:
  `python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<app description>" --design-system --persist -p "<ProjectName>"`
- This creates design-system/MASTER.md — treat it as the single source of truth for
  colors, typography, spacing, and component style going forward
- NEVER regenerate a new/different design system for a new page — only use
  `--page` overrides for genuine page-specific deviations (e.g. a login page's layout),
  never for a full new color palette or style direction
- Before starting ANY new page: read design-system/MASTER.md first, check
  design-system/pages/<page>.md for overrides, then build using shadcn/existing
  components styled per MASTER.md — do not re-run the generator "fresh" per page
- If MASTER.md doesn't exist yet, generate it once, get user approval on the output,
  THEN start building pages against it

## Mandatory before creating ANY UI element
1. Search src/ui/components/ for an existing component that fits — extend/compose it, never duplicate
2. If none exists, use the shadcn MCP tool to check/install the primitive:
   - Query available shadcn components via MCP before assuming one exists
   - Install via the MCP tool (or `npx shadcn add <component>` as fallback) —
     do NOT hand-build what shadcn already provides
3. Only write fully custom UI if NEITHER an existing component (step 1) NOR a shadcn
   primitive (step 2) covers it — and if so, it must be added to src/ui/components/
   (not inline in a page) so it's reusable going forward

## Tool precedence (avoid duplicate/conflicting UI sources)
1. src/ui/components/ (project's own reusable components) — always check first
2. shadcn MCP (installed) — for primitives not yet in step 1
3. ui-ux-pro-max MASTER.md — for styling/tokens (colors, spacing, typography) applied
   ON TOP of components from steps 1–2, never as a separate component source
4. Custom build — last resort only, must be added to src/ui/components/ after

## Avoid generic admin-panel look (mandatory)
- Do NOT default every screen to the same generic Table + Sidebar + Card layout —
  this is explicitly an anti-pattern for enterprise apps per ui-ux-pro-max
- Before building ANY screen, identify its VIEW TYPE and match the right pattern/component:
  | View type | Use | Avoid |
  |---|---|---|
  | List of records (Projects, Proposals) | Data-Dense Dashboard or Drill-Down pattern, @tanstack/react-table with sort/filter/pagination | Bare unstyled `<table>`, no empty/loading states |
  | Single record detail | Sectioned layout with clear hierarchy (summary card + tabs/accordion for related data) | Wall of unlabeled fields |
  | Forms (Create/Edit) | Multi-step or grouped sections for complex forms (Proposal, Payroll), inline validation feedback | One giant flat form with 20+ fields stacked |
  | Approval/workflow screens | Timeline/stepper component showing status progression | Plain dropdown with no visual state |
  | Dashboards/summary | BI/Analytics patterns from ui-ux-pro-max (Executive, Real-Time, Comparative) matched to the audience | Random assortment of cards with no hierarchy |
  | Search/filter-heavy screens | Persistent filter panel + result count + clear/reset | Filters that reset on every navigation |

## Before building any new screen
1. State explicitly: "View type: [X]. Pattern: [Y from table above]. Reason: [Z]"
2. Check design-system/MASTER.md for the visual language to apply
3. Pick shadcn/existing components that fit THIS view's interaction needs — not
   whatever component was used last time by default
4. If a screen has real complexity (e.g. Proposal approval with multiple stakeholders),
   use ui-ux-pro-max's design-system generator with `--domain style` scoped to that
   view type for a second opinion before defaulting to a basic layout

## Enterprise UI/UX standards to follow
- Consistent spacing/sizing via existing Tailwind config tokens — no arbitrary values (no `mt-[13px]`)
- All forms: same validation error style, same loading/disabled states as existing forms
- All tables: same pagination/sort/filter pattern across modules
- All buttons/inputs: only variants already defined in src/ui/components/ui/*
- Accessibility: labels on all inputs, keyboard navigation, ARIA where shadcn doesn't
  already provide it

## Forbidden
- Never introduce a second UI/component library alongside shadcn
- Never inline custom CSS/styled-components when Tailwind tokens already cover it
- Never force a bespoke design for something a package/existing component already does well
- Never let ui-ux-pro-max generate a new design direction per page — MASTER.md is fixed
  once approved; changing it requires explicit user approval, not an agent decision