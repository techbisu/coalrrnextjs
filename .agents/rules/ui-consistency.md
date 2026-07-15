# UI/UX Consistency Rule

## Mandatory before creating ANY UI element
1. Search src/ui/components/ for an existing component that fits — extend/compose it, never duplicate
2. If none exists, check if shadcn/ui (already installed) has the primitive — install via
   `npx shadcn add <component>`, do NOT hand-build what shadcn already provides
3. Only write fully custom UI if NEITHER an existing component NOR a shadcn primitive
   covers it — and if so, it must be added to src/ui/components/ (not inline in a page)
   so it's reusable going forward

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
