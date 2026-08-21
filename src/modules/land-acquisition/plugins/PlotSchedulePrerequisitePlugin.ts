/**
 * PlotSchedulePrerequisitePlugin
 *
 * Implements IEntityPrerequisitePlugin for the Land Acquisition module.
 *
 * ARCHITECTURE:
 * This plugin contains the ONLY module-specific prerequisite logic for land acquisition.
 * It has been EXTRACTED from WorkflowSnapshotQueryService and WorkflowGuardEvaluator
 * so that the core services contain zero acquisition-specific code.
 *
 * Registration: Container.ts → entityPrerequisiteRegistry.register(new PlotSchedulePrerequisitePlugin())
 *
 * Prerequisite:
 *   A Land Acquisition proposal must have at least 1 plot schedule entry
 *   before it can be forwarded from any state.
 */
import 'server-only'
import { MODULE_CODES } from '@/core/config/module-codes.config'
import type {
  IEntityPrerequisitePlugin,
  EntityPrerequisiteContext,
  EntityPrerequisiteResult,
  EntityPrerequisiteGuardResult,
} from '@/core/workflow/plugins/IEntityPrerequisitePlugin'
import type { WorkflowPendingAction, WorkflowActionItem } from '@/core/workflow/types/snapshot.types'
import type { IPlotRepository } from '@/domain/entities/plot/IPlotRepository'

export class PlotSchedulePrerequisitePlugin implements IEntityPrerequisitePlugin {
  readonly moduleCode = MODULE_CODES.LAND_SCHEDULE

  constructor(private readonly plotRepository: IPlotRepository) {}

  async evaluate(ctx: EntityPrerequisiteContext): Promise<EntityPrerequisiteResult> {
    const { entityId } = ctx

    const plotCount = await this.plotRepository.countByProposalId(entityId).catch(() => 0)
    const hasPlots = plotCount > 0

    const pendingActions: WorkflowPendingAction[] = []
    const completedActions: WorkflowActionItem[] = []

    if (!hasPlots) {
      pendingActions.push({
        id: `action-add-plot-${entityId}`,
        type: 'ACTION',
        code: 'ADD_PLOT_SCHEDULE',
        label: 'Add Plot Schedule',
        description: '0 plot(s) added — at least 1 plot schedule entry is required to proceed',
        status: 'PENDING',
        isAuthorizedForCurrentUser: true,
        metadata: { targetTab: 'plots' },
      })
    } else {
      completedActions.push({
        id: `action-add-plot-${entityId}`,
        actionCode: 'ADD_PLOT_SCHEDULE',
        label: 'Plot Schedule Added',
        justification: `${plotCount} plot ${plotCount === 1 ? 'entry' : 'entries'} added`,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        completedBy: 'System',
        metadata: { plotCount },
      })
    }

    return {
      allSatisfied: hasPlots,
      pendingActions,
      completedActions,
    }
  }

  async evaluateForGuard(ctx: EntityPrerequisiteContext): Promise<EntityPrerequisiteGuardResult> {
    const { entityId } = ctx

    const plotCount = await this.plotRepository.countByProposalId(entityId).catch(() => 0)

    if (plotCount === 0) {
      return {
        ok: false,
        reason: 'At least 1 plot schedule entry is required before proposal submission',
      }
    }

    return { ok: true }
  }
}
