import { Result, Ok, Fail } from '@/core'
import { db } from '@/lib/db'
import { Audit } from '@/core/audit/services/AuditService'
import { milestoneConfig } from '@/core/config/milestone.config'

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
      // Validation: Enforce logical sequence based on milestoneConfig
      const allMilestones = [...milestoneConfig.CBA, ...milestoneConfig.DP];
      const milestoneDef = allMilestones.find(m => m.id === data.milestone_type);

      if (milestoneDef && milestoneDef.requires && milestoneDef.requires.length > 0) {
        // Fetch existing milestones for this entity
        const existingHistory = await this.getHistory(data.entity_type, data.entity_id);
        const existingTypes = new Set(existingHistory.isSuccess ? existingHistory.value.map((m: any) => m.milestone_type) : []);

        const missingDeps = milestoneDef.requires.filter(req => !existingTypes.has(req));
        
        if (missingDeps.length > 0) {
          const missingLabels = missingDeps.map(req => {
            const depDef = allMilestones.find(m => m.id === req);
            return depDef ? depDef.label : req;
          }).join(', ');
          
          return Fail(`Cannot record ${milestoneDef.label}. Missing prerequisite milestones: ${missingLabels}`);
        }
      }

      const milestone = await (db as any).manual_milestone.create({
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

      Audit.logCustomAction({
        activity: `[MILESTONE_RECORDED] on MANUAL_MILESTONE (${milestone.id}) | Remarks: ${JSON.stringify({ milestone: data.milestone_type, entity: data.entity_id, outcome: data.outcome })}`,
        userId: data.user_id || 'system'
      }).catch(console.error);

      // Dispatch event to WorkflowReactionService (decoupled reaction trigger)
      const { workflowReactionService } = await import('./WorkflowReactionService')
      workflowReactionService.handleEvent('milestone_recorded', {
        entityType: data.entity_type,
        entityId: data.entity_id,
        data: {
          milestone_code: data.milestone_type,
          outcome: data.outcome,
          user_id: data.user_id,
        },
      }).catch(err => console.error('WorkflowReaction error:', err))

      return Ok(milestone)
    } catch (e: any) {
      console.error('ManualMilestoneService.recordMilestone error:', e)
      return Fail(e.message)
    }
  }

  async getHistory(entityType: string, entityId: string): Promise<Result<any[]>> {
    try {
      const records = await (db as any).manual_milestone.findMany({
        where: {
          entity_type: entityType,
          entity_id: entityId
        },
        orderBy: {
          sent_at: 'asc'
        }
      })
      return Ok(records)
    } catch (e: any) {
      console.error('ManualMilestoneService.getHistory error:', e)
      return Fail(e.message)
    }
  }

  private async createProposalSnapshot(proposalId: string, userId: string) {
    const proposalData = await db.acq_proposal.findUnique({
      where: { proposal_id: proposalId }
    })

    if (!proposalData) return

    await (db as any).proposal_snapshot.create({
      data: {
        proposal_id: proposalId,
        snapshot_data: proposalData,
        created_by: userId
      }
    })
  }
}

export const manualMilestoneService = new ManualMilestoneService()
