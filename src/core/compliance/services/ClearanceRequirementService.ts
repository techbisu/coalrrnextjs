import { PROJECT_CONFIG } from '@/config/project.config'

export interface ClearanceRequirement {
  key: string
  label: string
  level: string
  mandatory: boolean
}

export class ClearanceRequirementService {
  /**
   * Evaluates and returns clearances required at the project/baseline level.
   * Typically DGMS, Environment.
   */
  static getProjectLevelRequirements(project?: any): ClearanceRequirement[] {
    return PROJECT_CONFIG.statutoryClearances
      .filter(c => c.level === 'PROJECT')
      .map(c => ({
        key: c.key,
        label: c.label,
        level: c.level,
        mandatory: c.mandatory
      }))
  }

  /**
   * Evaluates and returns clearances required at the plot level (e.g. for a specific proposal).
   * Runs the rule engine hooks to determine if plot characteristics (like Forest Land) trigger specific clearances.
   */
  static getPlotLevelRequirements(plots: any[]): ClearanceRequirement[] {
    const required = new Map<string, ClearanceRequirement>()

    for (const plot of plots) {
      PROJECT_CONFIG.statutoryClearances
        .filter(c => c.level === 'PLOT')
        .forEach(c => {
          if (c.requiredCondition && c.requiredCondition(plot)) {
            required.set(c.key, {
              key: c.key,
              label: c.label,
              level: c.level,
              mandatory: c.mandatory
            })
          }
        })
    }

    return Array.from(required.values())
  }
}
