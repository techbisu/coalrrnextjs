# modules/project-master Module

## Purpose
This module is responsible for the modules/project-master layer of the application. It encapsulates logic, components, and services specific to this domain.

## File-by-file breakdown
| File | Description |
|------|-------------|
| `modules/project-master/components/LockBaselineDialog.tsx` | React component for capturing the initial Form-I board document, locking the baseline limits, and making the project immutable. |
| `modules/project-master/components/ProjectFormDialog.tsx` | React component for ProjectFormDialog. |
| `modules/project-master/components/ProjectMasterView.tsx` | Main React dashboard component orchestrating the Project Grid, Maps, Compliance progress bars, and Form-XXII approvals. |
| `modules/project-master/components/FormXXIIModal.tsx` | React component that simulates Form-XXII deviations and processes Board approvals. |
| `modules/project-master/types/index.ts` | Provides functionality related to index. |

## Key dependencies
**Internal Modules:**
- `components`
- `localization`
- `core`
- `application`
- `lib`
- `authorization`
- `providers`

**External Packages:**
- `react`
- `@tanstack/react-query`
- `sonner`
- `lucide-react`
- `react-hook-form`
- `@hookform/resolvers/zod`
- `zod`

## Entry points
- No explicit entry points (Internal module).
