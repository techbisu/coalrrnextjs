/**
 * Checklist Value Object - Mode-specific checklist for proposals.
 */
import { ValueObject } from '@/core/base/ValueObject'
import { AcquisitionMode } from './AcquisitionMode'

export interface ChecklistItem {
  key: string
  label: string
  required: boolean
  status: 'pending' | 'in_progress' | 'complete' | 'not_applicable'
}

export interface ChecklistProps {
  checklistCode: string
  items: ChecklistItem[]
}

export class Checklist extends ValueObject<ChecklistProps> {
  private constructor(props: ChecklistProps) {
    super(props)
  }

  static createForMode(mode: AcquisitionMode): Checklist {
    const baseItems: ChecklistItem[] = [
      { key: 'plot_schedule', label: 'Plot schedule with boundaries', required: true, status: 'pending' },
      { key: 'title_verification', label: 'Title chain verified', required: true, status: 'pending' },
    ]

    const modeSpecificItems: Record<string, ChecklistItem[]> = {
      cba_act: [
        { key: 'cba_consent', label: 'CBA consent resolution', required: true, status: 'pending' },
        { key: 'cba_section', label: '§7/§9 CBA Act notification', required: true, status: 'pending' },
      ],
      direct_purchase: [
        { key: 'consent_letter', label: 'Written consent from landowner', required: true, status: 'pending' },
        { key: 'valuation_sheet', label: 'Valuation per PWD rate chart', required: true, status: 'pending' },
        { key: 'mutation_status', label: 'Mutation status verified', required: true, status: 'pending' },
      ],
      rfctlarr: [
        { key: 'notification_4_1', label: '§4(1) Preliminary notification', required: true, status: 'pending' },
        { key: 'notification_4_2', label: '§4(2) SIA & public hearing', required: true, status: 'pending' },
        { key: 'public_hearing', label: 'Public hearing conducted', required: true, status: 'pending' },
        { key: 'award_draft', label: 'Draft award statement', required: true, status: 'pending' },
      ],
      patta: [
        { key: 'patta_record', label: 'Patta record extracted', required: true, status: 'pending' },
        { key: 'tribal_clearance', label: 'Tribal/SC clearance (if applicable)', required: false, status: 'pending' },
      ],
    }

    const items = [...baseItems, ...(modeSpecificItems[mode.value] ?? [])]

    return new Checklist({
      checklistCode: mode.getChecklistCode(),
      items,
    })
  }

  static fromJSON(json: string): Checklist {
    const parsed = JSON.parse(json) as ChecklistProps
    return new Checklist(parsed)
  }

  updateItemStatus(itemKey: string, status: ChecklistItem['status']): Checklist {
    const items = this._value.items.map(item =>
      item.key === itemKey ? { ...item, status } : item
    )

    return new Checklist({
      checklistCode: this._value.checklistCode,
      items,
    })
  }

  getItem(itemKey: string): ChecklistItem | undefined {
    return this._value.items.find(item => item.key === itemKey)
  }

  getAllItems(): ReadonlyArray<ChecklistItem> {
    return this._value.items
  }

  getRequiredItems(): ChecklistItem[] {
    return this._value.items.filter(item => item.required)
  }

  getCompletedRequiredItems(): ChecklistItem[] {
    return this.getRequiredItems().filter(item => item.status === 'complete')
  }

  areAllRequiredItemsComplete(): boolean {
    const required = this.getRequiredItems()
    const completed = this.getCompletedRequiredItems()
    return required.length > 0 && required.length === completed.length
  }

  getProgress(): {
    completedRequired: number
    totalRequired: number
    percentage: number
  } {
    const totalRequired = this.getRequiredItems().length
    const completedRequired = this.getCompletedRequiredItems().length
    const percentage = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0

    return {
      completedRequired,
      totalRequired,
      percentage,
    }
  }

  toJSON(): string {
    return JSON.stringify(this._value)
  }

  get checklistCode(): string {
    return this._value.checklistCode
  }
}
