# modules/land-acquisition Module

## Purpose
This module is responsible for the modules/land-acquisition layer of the application. It encapsulates logic, components, and services specific to this domain.

## File-by-file breakdown
| File | Description |
|------|-------------|
| `modules/land-acquisition/components/AcquisitionDetail.tsx` | React component for AcquisitionDetail. |
| `modules/land-acquisition/components/AcquisitionDetailTabs.tsx` | React component for AcquisitionDetailTabs. |
| `modules/land-acquisition/components/AcquisitionList.tsx` | React component for AcquisitionList. |
| `modules/land-acquisition/components/AcquisitionListView.tsx` | React component for AcquisitionListView. |
| `modules/land-acquisition/components/CreateProposalDialog.tsx` | React component for CreateProposalDialog. |
| `modules/land-acquisition/components/NewProposalAction.tsx` | React component for NewProposalAction. |
| `modules/land-acquisition/interfaces/IClaimRepository.ts` | Handles database operations for IClaim. |
| `modules/land-acquisition/interfaces/IPlotRepository.ts` | Handles database operations for IPlot. |
| `modules/land-acquisition/repositories/ProposalRepository.ts` | Handles database operations for Proposal. |
| `modules/land-acquisition/types/index.ts` | Provides functionality related to index. |

## Key dependencies
**Internal Modules:**
- `components`
- `lib`
- `authorization`
- `providers`
- `core`
- `shared`

**External Packages:**
- `react`
- `next/link`
- `next/navigation`
- `lucide-react`
- `@tanstack/react-query`
- `sonner`

## Entry points
- No explicit entry points (Internal module).
