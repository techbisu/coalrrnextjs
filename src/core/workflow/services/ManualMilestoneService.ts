import { Result, Ok, Fail } from '@/core'
import { db } from '@/lib/db'
import { auditQueue } from '@/infrastructure/di/modules/core.di'

export interface RecordMilestoneDTO {
  entity_type: string;
  entity_id: string;
  milestone_type: string;
  authority?: string;
  reference_no?: string;
  milestone_date: Date; // Map to sent_at or received_at
  outcome: string;
  remarks?: string;
  proof_document_id?: string;
  user_id: string;
}

export class ManualMilestoneService {
  async recordMilestone(data: RecordMilestoneDTO): Promise<Result<any>> {
    try {
      const milestone = await db.manual_milestone.create({
        data: {
          entity_type: data.entity_type,
          entity_id: data.entity_id,
          milestone_type: data.milestone_type,
          authority_name: data.authority,
          reference_no: data.reference_no,
          sent_at: data.milestone_date,
          received_at: data.milestone_date,
          outcome: data.outcome,
          remarks: data.remarks,
          document_id: data.proof_document_id,
          entry_by: data.user_id,
        }
      })

      if (data.entity_type === 'PROPOSAL' || data.entity_type === 'LAND_ACQ_PROPOSAL') {
        await this.createProposalSnapshot(data.entity_id, data.user_id)
      }

      await auditQueue.push({
        action: 'MILESTONE_RECORDED',
        entity_name: 'MANUAL_MILESTONE',
        entity_id: milestone.id,
        user_id: data.user_id,
        remarks: JSON.stringify({ milestone: data.milestone_type, entity: data.entity_id, outcome: data.outcome })
      })

      return Ok(milestone)
    } catch (e: any) {
      console.error('ManualMilestoneService.recordMilestone error:', e)
      return Fail(e.message)
    }
  }

  private async createProposalSnapshot(proposalId: string, userId: string) {
    const proposalData = await db.acq_proposal.findUnique({
      where: { proposal_id: proposalId },
      include: {
        plot_schedule: true,
      }
    })

    if (!proposalData) return

    await db.proposal_snapshot.create({
      data: {
        proposal_id: proposalId,
        snapshot_type: 'MILESTONE_SNAPSHOT',
        data: proposalData as any,
        generated_by: userId
      }
    })
  }

  async getHistory(entityType: string, entityId: string): Promise<Result<any[]>> {
    try {
      const history = await db.manual_milestone.findMany({
        where: { entity_type: entityType, entity_id: entityId },
        orderBy: { sent_at: 'desc' }
      })
      return Ok(history)
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
