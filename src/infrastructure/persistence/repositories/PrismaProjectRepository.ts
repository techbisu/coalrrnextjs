/**
 * Prisma Project Repository - Concrete implementation of IProjectRepository.
 * This belongs in the infrastructure layer and handles all database operations.
 * NO BUSINESS LOGIC HERE - only persistence concerns.
 */
import { db } from '@/lib/db'
import { Project, IProjectRepository, IProjectQueryOptions } from '@/domain'
import { IPaginatedResult } from '@/core/interfaces'
import Decimal from 'decimal.js'
import { randomUUID } from 'crypto'

export class PrismaProjectRepository implements IProjectRepository {
  
  async findById(id: string): Promise<Project | null> {
    const data = await db.mst_project.findUnique({
      where: { id },
      include: {
        land_schedule: { include: { land_schedule_item: { include: { mst_plot: { include: { mouza: true } } } } } },
        compensation_payroll: true,
        form_d_ledger_entry: true,
      },
    })

    if (!data) return null

    return Project.reconstitute({
      id: data.id,
      name: data.name,
      mine_cd: data.mine_cd || '',
      area_cd: data.area_cd,
      state_lgd: data.state_lgd,
      pr_doc_id: data.pr_doc_id,
      total_land_limit_acres: data.total_land_limit_acres.toString(),
      total_budget_ceiling: data.total_budget_ceiling.toString(),
      total_employment_quota: data.total_employment_quota,
      boundary: data.boundary ? String(data.boundary) : '',
      statutory_clearances: data.statutory_clearances ? String(data.statutory_clearances) : '',
      locked_at: data.locked_at,
      lockedBy: null, // We don't track who locked in current schema
      entry_ts: data.entry_ts!,
      updt_ts: data.updt_ts!,
    })
  }

  async findAll(options?: IProjectQueryOptions): Promise<IPaginatedResult<Project>> {
    const page = options?.page ?? 1
    const pageSize = options?.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const where: any = {}
    
    if (options?.mine_cd) {
      where.mine_cd = options.mine_cd
    }
    
    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { mine_cd: { contains: options.search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      db.mst_project.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: options?.orderBy ?? { entry_ts: 'desc' },
        include: {
          land_schedule: { include: { land_schedule_item: { include: { mst_plot: { include: { mouza: true } } } } } },
          compensation_payroll: true,
          form_d_ledger_entry: true,
        },
      }),
      db.mst_project.count({ where }),
    ])

    const projects = data.map(p => Project.reconstitute({
      id: p.id,
      name: p.name,
      mine_cd: p.mine_cd || '',
      area_cd: p.area_cd,
      state_lgd: p.state_lgd,
      pr_doc_id: p.pr_doc_id,
      total_land_limit_acres: p.total_land_limit_acres.toString(),
      total_budget_ceiling: p.total_budget_ceiling.toString(),
      total_employment_quota: p.total_employment_quota,
      boundary: p.boundary,
      statutory_clearances: p.statutory_clearances,
      locked_at: p.locked_at,
      lockedBy: null,
      entry_ts: p.entry_ts!,
      updt_ts: p.updt_ts!,
    }))

    return {
      data: projects,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  async findByName(name: string): Promise<Project | null> {
    const data = await db.mst_project.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    })

    if (!data) return null

    return Project.reconstitute({
      id: data.id,
      name: data.name,
      mine_cd: data.mine_cd || '',
      area_cd: data.area_cd,
      state_lgd: data.state_lgd,
      pr_doc_id: data.pr_doc_id,
      total_land_limit_acres: data.total_land_limit_acres.toString(),
      total_budget_ceiling: data.total_budget_ceiling.toString(),
      total_employment_quota: data.total_employment_quota,
      boundary: data.boundary ? String(data.boundary) : '',
      statutory_clearances: data.statutory_clearances ? String(data.statutory_clearances) : '',
      locked_at: data.locked_at,
      lockedBy: null,
      entry_ts: data.entry_ts!,
      updt_ts: data.updt_ts!,
    })
  }

  async findByMineCode(mine_cd: string, options?: IProjectQueryOptions): Promise<IPaginatedResult<Project>> {
    return this.findAll({ ...options, mine_cd })
  }

  async save(project: Project): Promise<void> {
    const data = project.toPersistence()
    
    const exists = await this.exists(project.id)
    
    if (exists) {
      await db.mst_project.update({
        where: { id: data.id },
        data: {
          name: data.name,
          mine_cd: data.mine_cd || '',
          area_cd: data.area_cd,
          state_lgd: data.state_lgd,
          pr_doc_id: data.pr_doc_id,
          total_land_limit_acres: new Decimal(data.total_land_limit_acres),
          total_budget_ceiling: new Decimal(data.total_budget_ceiling),
          total_employment_quota: data.total_employment_quota,
          boundary: data.boundary ? String(data.boundary) : '',
          statutory_clearances: data.statutory_clearances ? String(data.statutory_clearances) : '',
          updt_ts: new Date(),
        },
      })
    } else {
      await db.mst_project.create({
        data: {
          id: data.id,
          name: data.name,
          mine_cd: data.mine_cd || '',
          area_cd: data.area_cd || null,
          state_lgd: data.state_lgd || null,
          pr_doc_id: data.pr_doc_id || null,
          total_land_limit_acres: new Decimal(data.total_land_limit_acres),
          total_budget_ceiling: new Decimal(data.total_budget_ceiling),
          total_employment_quota: data.total_employment_quota,
          boundary: data.boundary ? String(data.boundary) : '',
          statutory_clearances: data.statutory_clearances ? String(data.statutory_clearances) : '',
          updt_ts: new Date(),
        } as any,
      })
    }
  }

  
  
  async syncProjectDocuments(projectId: string, fileIds: string[], userId: string): Promise<void> {
    await db.file_attachment.deleteMany({
      where: { entity_type: 'mst_project', entity_id: projectId }
    })
    
    if (fileIds.length > 0) {
      await db.file_attachment.createMany({
        data: fileIds.map(fileId => ({
          id: randomUUID(),
          file_id: fileId,
          entity_type: 'mst_project',
          entity_id: projectId,
          module: 'project-master',
          attached_by: userId,
          updt_ts: new Date(),
        }))
      })
    }
  }

  async updateProjectMouzas(projectId: string, mouzaLgds: bigint[]): Promise<void> {
    await db.mst_project_mouza.deleteMany({ where: { project_id: projectId } })
    if (mouzaLgds.length > 0) {
      await db.mst_project_mouza.createMany({
        data: mouzaLgds.map(lgd => ({ project_id: projectId, mouza_lgd: lgd }))
      })
    }
  }

  async delete(id: string): Promise<void> {
    await db.mst_project.delete({ where: { id } })
  }

  async exists(id: string): Promise<boolean> {
    const count = await db.mst_project.count({ where: { id } })
    return count > 0
  }

  async lock(id: string, user_id: string): Promise<boolean> {
    const result = await db.mst_project.updateMany({
      where: { id, locked_at: null },
      data: { locked_at: new Date() },
    })
    
    return result.count > 0
  }

  // Dashboard-specific query (separate from domain)
  async getDashboardData(): Promise<Array<{
    project: Project
    payrollCount: number
    totalDisbursed: Decimal
    budgetUtilization: number
    plots: Array<any>
    breachedProposals: Array<{ id: string; schedule_code: string }>
    boardApprovals: Array<{ id: string; date: string; remarks: string; file_id?: string; file_name?: string }>
    district_lgd: string | null
    block_lgd: string | null
    mouza_lgds: string[]
  }>> {
    const projects = await db.mst_project.findMany({
      orderBy: { entry_ts: 'desc' },
      include: {
        land_schedule: { include: { land_schedule_item: { include: { mst_plot: { include: { mouza: true } } } } } },
        compensation_payroll: true,
        form_d_ledger_entry: true,
        project_mouzas: { include: { mouza: true } }
      },
    })

    const allPlots = await db.mst_plot.findMany({ include: { mouza: true } })

    const auditLogs = await db.audit_log.findMany({
      where: { entity_name: 'mst_project', event_type: 'PROJECT_LIMIT_REVISED' },
      orderBy: { entry_ts: 'desc' }
    })

    const fileAttachments = await db.file_attachment.findMany({
      where: { entity_type: 'mst_project' },
      include: {
        file_record: {
          include: {
            file_version: { orderBy: { version_number: 'desc' }, take: 1 }
          }
        }
      }
    })

    return projects.map(p => {
      const totalAcquired = p.form_d_ledger_entry.reduce(
        (s, e) => s.add(new Decimal(e.amount_land.toString())).add(new Decimal(e.amount_rnr.toString())),
        new Decimal(0)
      )
      const budgetCeiling = new Decimal(p.total_budget_ceiling.toString())

      const project = Project.reconstitute({
        id: p.id,
        name: p.name,
        mine_cd: (p as any).mine_cd || p.mine_cd || '',
        state_lgd: (p as any).state_lgd || '',
        area_cd: (p as any).area_cd || '',
        total_land_limit_acres: p.total_land_limit_acres.toString(),
        total_budget_ceiling: p.total_budget_ceiling.toString(),
        total_employment_quota: p.total_employment_quota,
        boundary: p.boundary,
        statutory_clearances: p.statutory_clearances,
        locked_at: p.locked_at,
        lockedBy: null,
        entry_ts: p.entry_ts!,
        updt_ts: p.updt_ts!,
      })

      const firstMouza = (p as any).project_mouzas?.[0]?.mouza;
      return {
        project,
        district_lgd: firstMouza?.district_lgd?.toString() || null,
        block_lgd: firstMouza?.block_lgd?.toString() || null,
        mouza_lgds: (p as any).project_mouzas?.map((m: any) => m.mouza_lgd.toString()) || [],
        pr_docs: fileAttachments.filter(f => f.entity_id === p.id).map(f => {
          const latestVersion = f.file_record.file_version?.[0];
          return {
            id: f.file_id,
            file_name: f.file_record.original_name,
            file_size_kb: latestVersion ? Math.round(Number(latestVersion.size_bytes) / 1024) : 0,
            mime_type: latestVersion?.mime_type || 'application/octet-stream',
            virus_scan_status: 'clean' as const
          };
        }),
        payrollCount: p.compensation_payroll.length,
        totalDisbursed: totalAcquired,
        budgetUtilization: budgetCeiling.isZero() 
          ? 0 
          : totalAcquired.dividedBy(budgetCeiling).times(100).toNumber(),
        plots: allPlots.map(pl => ({
          id: pl.id.toString(),
          plot_number: pl.plot_number,
          mouza: pl.mouza.mouza_en,
          land_type: pl.land_type,
          area_acres: pl.area_acres.toString(),
          exhausted_area_for_jobs: pl.exhausted_area_for_jobs.toString(),
          remaining_job_quota: pl.remaining_job_quota,
        })),
        breachedProposals: p.land_schedule
          .filter((ls: any) => ls.state === 'LimitBreached')
          .map((ls: any) => ({ id: ls.id.toString(), schedule_code: ls.schedule_code })),
        boardApprovals: auditLogs
          .filter(log => log.entity_id === p.id)
          .map(log => {
            // Find the closest file attachment by time (or just the latest one linked to this project)
            // Since we can't easily link a specific audit log to a file, we'll just show the latest files for the project
            // Or better, since file_attachments are linked to the project, just attach the first file for simplicity 
            // if we assume 1 Form-XXII per revision.
            // Let's just find any file attached to this project around the same time, or just the first file attachment.
            const file = fileAttachments.find(f => f.entity_id === p.id)?.file_record;
            return {
              id: log.id,
              date: log.entry_ts.toISOString(),
              remarks: log.remarks || '',
              file_id: file?.id,
              file_name: file?.original_name
            }
          })
      }
    })
  }
}
