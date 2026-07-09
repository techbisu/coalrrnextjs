import { ProposalRepository } from '../repositories/ProposalRepository'
import { db } from '@/lib/db'

export class ProposalService {
  private repo = new ProposalRepository()

  async getProposals() {
    return this.repo.findAll()
  }

  async getProposalById(id: string) {
    return this.repo.findById(id)
  }

  async createProposal(data: {
    projectId: string
    acquisitionMode: string
    proposalTitle: string
    description?: string
    areaOffice?: string
    collieryCode?: string
    adjacentColliery?: string
    notificationDate?: string
    userName: string
    userRole: string
  }) {
    const project = await db.mstProject.findUnique({ where: { id: data.projectId } })
    if (!project) throw new Error('Project not found')
    if (!project.lockedAt) throw new Error('Cannot create proposal against an unlocked project baseline.')

    const checklist = this.buildModeChecklist(data.acquisitionMode)
    const scheduleCode = `SCH-${new Date().getFullYear()}-${String(Math.floor(1 + Math.random() * 999)).padStart(3, '0')}`

    return this.repo.create({
      projectId: data.projectId,
      scheduleCode,
      acquisitionMode: data.acquisitionMode,
      state: 'Drafting',
      proposalTitle: data.proposalTitle,
      description: data.description ?? '',
      proposedBy: data.userName,
      proposedByRole: data.userRole,
      areaOffice: data.areaOffice ?? '',
      collieryCode: data.collieryCode ?? project.collieryCode,
      adjacentColliery: data.adjacentColliery ?? '',
      totalAreaAcres: '0.0000',
      notificationDate: data.notificationDate ? new Date(data.notificationDate) : null,
      modeSpecificChecklist: JSON.stringify(checklist),
      annexureA: JSON.stringify([]),
      annexureB: JSON.stringify([]),
      annexureC: JSON.stringify([]),
    })
  }

  async updateProposal(id: string, data: any) {
    const s = await this.repo.findById(id)
    if (!s) throw new Error('Schedule not found')
    if (s.state !== 'Drafting') throw new Error(`Cannot edit schedule in state ${s.state}`)
    return this.repo.update(id, data)
  }

  async updateChecklistItem(id: string, itemKey: string, status: string) {
    const s = await this.repo.findById(id)
    if (!s) throw new Error('Schedule not found')
    if (s.state !== 'Drafting' && s.state !== 'AreaVetting') throw new Error(`Cannot edit checklist in state ${s.state}`)

    const checklist = JSON.parse(s.modeSpecificChecklist ?? '{"items":[]}')
    const items = checklist.items ?? []
    const idx = items.findIndex((i: any) => i.key === itemKey)
    if (idx === -1) throw new Error(`Checklist item "${itemKey}" not found`)

    items[idx].status = status
    checklist.items = items

    await this.repo.update(id, { modeSpecificChecklist: JSON.stringify(checklist) })

    const requiredItems = items.filter((i: any) => i.required)
    const completedRequired = requiredItems.filter((i: any) => i.status === 'complete').length
    
    return {
      itemKey,
      newStatus: status,
      checklistCode: checklist.checklistCode,
      progress: {
        completedRequired,
        totalRequired: requiredItems.length,
        allRequiredDone: completedRequired === requiredItems.length
      }
    }
  }

  async addPlotToProposal(scheduleId: string, plotId: string, annexureTag: string) {
    const s = await this.repo.findById(scheduleId)
    if (!s) throw new Error('Schedule not found')
    if (s.state !== 'Drafting') throw new Error(`Cannot add items to schedule in state ${s.state}`)

    const plot = await db.mstPlot.findUnique({ where: { id: plotId } })
    if (!plot) throw new Error('Plot not found')

    const existingItem = await db.landScheduleItem.findFirst({
      where: { plotId, isActive: true, schedule: { state: { not: 'Cancelled' } } },
      include: { schedule: true }
    })
    if (existingItem && existingItem.scheduleId !== scheduleId) {
      throw new Error(`Plot ${plot.plotNumber} is already active in schedule ${existingItem.schedule.scheduleCode}.`)
    }

    await this.repo.addItem({
      scheduleId,
      plotId,
      annexureTag,
      isActive: true
    })

    return this.recalculateArea(scheduleId)
  }

  async removePlotFromProposal(scheduleId: string, itemId: string) {
    const s = await this.repo.findById(scheduleId)
    if (!s) throw new Error('Schedule not found')
    if (s.state !== 'Drafting') throw new Error(`Cannot remove items from schedule in state ${s.state}`)

    await this.repo.deleteItem(itemId)
    return this.recalculateArea(scheduleId)
  }

  async reclassifyPlotAnnexure(scheduleId: string, itemId: string, annexureTag: string) {
    const s = await this.repo.findById(scheduleId)
    if (!s) throw new Error('Schedule not found')
    if (s.state !== 'Drafting') throw new Error(`Cannot reclassify items in schedule in state ${s.state}`)

    await db.landScheduleItem.update({ where: { id: itemId }, data: { annexureTag } })
    return this.recalculateArea(scheduleId)
  }

  async verifyProposal(id: string, userName: string, action: 'submit' | 'approve' | 'reject', comments: string) {
    const s = await this.repo.findById(id)
    if (!s) throw new Error('Schedule not found')

    let newState = s.state
    if (action === 'submit' && s.state === 'Drafting') {
      const checklist = JSON.parse(s.modeSpecificChecklist ?? '{"items":[]}')
      const requiredItems = (checklist.items ?? []).filter((i: any) => i.required)
      const allDone = requiredItems.every((i: any) => i.status === 'complete')
      if (!allDone) throw new Error('Cannot submit proposal until all required checklist items are complete.')
      newState = 'AreaVetting'
    } else if (action === 'approve' && s.state === 'AreaVetting') {
      newState = 'Approved'
    } else if (action === 'reject') {
      newState = 'Drafting'
    } else {
      throw new Error(`Invalid transition from ${s.state} using action ${action}`)
    }

    await this.repo.update(id, { state: newState })

    // Log the event
    await db.approvalEvent.create({
      data: {
        entityType: 'LandSchedule',
        entityId: id,
        fromState: s.state,
        toState: newState,
        action,
        comments,
        actorId: userName, // Ideally user ID, but name is what was used
      }
    })

    return { newState }
  }

  private async recalculateArea(scheduleId: string) {
    const allItems = await db.landScheduleItem.findMany({
      where: { scheduleId, isActive: true },
      include: { plot: true }
    })
    const totalArea = allItems.reduce((sum, it) => sum + Number(it.plot.areaAcres), 0)

    await this.repo.update(scheduleId, {
      totalAreaAcres: totalArea.toFixed(4),
      annexureA: JSON.stringify(allItems.filter((i) => i.annexureTag === 'A').map((i) => i.plotId)),
      annexureB: JSON.stringify(allItems.filter((i) => i.annexureTag === 'B').map((i) => i.plotId)),
      annexureC: JSON.stringify(allItems.filter((i) => i.annexureTag === 'C').map((i) => i.plotId)),
    })

    return { totalAreaAcres: totalArea.toFixed(4), itemCount: allItems.length }
  }

  private buildModeChecklist(mode: string) {
    const base = [
      { key: 'plot_schedule', label: 'Plot schedule with boundaries', required: true, status: 'pending' },
      { key: 'title_verification', label: 'Title chain verified', required: true, status: 'pending' },
    ]
    const modeSpecific: Record<string, any[]> = {
      cba_act: [...base, { key: 'cba_consent', label: 'CBA consent resolution', required: true, status: 'pending' }, { key: 'cba_section', label: '§7/§9 CBA Act notification', required: true, status: 'pending' }],
      direct_purchase: [...base, { key: 'consent_letter', label: 'Written consent from landowner', required: true, status: 'pending' }, { key: 'valuation_sheet', label: 'Valuation per PWD rate chart', required: true, status: 'pending' }, { key: 'mutation_status', label: 'Mutation status verified', required: true, status: 'pending' }],
      rfctlarr: [...base, { key: 'notification_4_1', label: '§4(1) Preliminary notification', required: true, status: 'pending' }, { key: 'notification_4_2', label: '§4(2) SIA & public hearing', required: true, status: 'pending' }, { key: 'public_hearing', label: 'Public hearing conducted', required: true, status: 'pending' }, { key: 'award_draft', label: 'Draft award statement', required: true, status: 'pending' }],
      patta: [...base, { key: 'patta_record', label: 'Patta record extracted', required: true, status: 'pending' }, { key: 'tribal_clearance', label: 'Tribal/SC clearance (if applicable)', required: false, status: 'pending' }],
    }
    const codeMap: Record<string, string> = { cba_act: 'CL-1.1', direct_purchase: 'CL-1.2', rfctlarr: 'CL-1.3', patta: 'CL-1.4' }
    return { checklistCode: codeMap[mode] ?? 'CL-1.0', items: modeSpecific[mode] ?? base }
  }
}
