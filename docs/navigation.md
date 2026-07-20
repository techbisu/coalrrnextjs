# Navigation Documentation

## Sidebar Layout Architecture

The main application shell (`EnterpriseShell.tsx`) uses a fixed sidebar layout constructed with custom Tailwind classes combined with Shadcn UI's standard `SidebarHeader`, `SidebarContent`, and `SidebarFooter`.

### Key Features
- **Fixed Positioning:** The sidebar (`<aside>`) uses `lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)]` layout to remain pinned to the left edge of the screen, underneath the global navigation header. It never scrolls with the main page body.
- **Internal Scroll (Scrollbar Hidden):** 
  - The menu list is rendered inside a `SidebarContent` wrapper with `overflow-y-auto`. 
  - To maintain a clean UI, the visible scrollbar is hidden using custom CSS in `globals.css` (`.sidebar-scroll` class), but the container remains fully scrollable via mouse wheel, trackpad, and keyboard accessibility.
- **Application Versioning:** The sidebar footer (`SidebarFooter`) displays the current application version, which is read directly from the root `package.json` (`version` property) to ensure a single source of truth without hardcoding. The translation key `shell.version` handles localization for the label.
