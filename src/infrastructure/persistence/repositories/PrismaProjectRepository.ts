import { db } from '@/lib/db'
import { Project, IProjectRepository, IProjectQueryOptions } from '@/domain'
import { IPaginatedResult } from '@/core/interfaces'
import Decimal from 'decimal.js'
import { PROJECT_CONFIG } from '@/config/project.config'

export class PrismaProjectRepository implements IProjectRepository {
  
  async generateEclProjCd(areaCd?: string, mineCd?: string): Promise<string> {
    const year = new Date().getFullYear();
    let shortCode = areaCd || 'UNK';
    let mineCode = mineCd || 'UNK';

    if (areaCd) {
      const area = await db.area_master.findUnique({
        where: { area_cd: areaCd }
      });
      if (area && area.short_nm) {
        shortCode = area.short_nm;
      }
    }

    const template = PROJECT_CONFIG.eclProjCdFormat;
    
    // We need to find the max sequence for the prefix BEFORE {SEQ}
    // Assuming {SEQ} is always at the end of the format
    const prefixTemplate = template.split('{SEQ}')[0];
    const prefix = prefixTemplate
      .replace('{AREA}', shortCode)
      .replace('{MINE}', mineCode)
      .replace('{YEAR}', year.toString());

    // Find the max sequence for this prefix
    const latestProject = await db.project.findFirst({
      where: {
        eclProjCd: {
          startsWith: prefix
        }
      },
      orderBy: {
        eclProjCd: 'desc'
      },
      select: {
        eclProjCd: true
      }
    });

    let nextSequence = 1;
    if (latestProject && latestProject.eclProjCd) {
      // We need to extract the sequence part
      // Since prefix is everything before {SEQ}, the rest is the sequence
      const seqStr = latestProject.eclProjCd.substring(prefix.length);
      const parsedSeq = parseInt(seqStr, 10);
      if (!isNaN(parsedSeq)) {
        nextSequence = parsedSeq + 1;
      }
    }

    const paddedSequence = nextSequence.toString().padStart(4, '0');
    return template
      .replace('{AREA}', shortCode)
      .replace('{MINE}', mineCode)
      .replace('{YEAR}', year.toString())
      .replace('{SEQ}', paddedSequence);
  }
  async findById(id: string): Promise<Project | null> {
    const data = await db.project.findUnique({
      where: { projCd: id },
    })

    if (!data) return null

    return Project.reconstitute({
      projCd: data.projCd,
      projNm: data.projNm,
      eclProjCd: data.eclProjCd || '',
      projectDesc: data.projectDesc,
      totalApprovedArea: data.totalApprovedArea?.toString() || '0',
      totalAcquiredArea: data.totalAcquiredArea?.toString() || '0',
      totalEmpSanctioned: data.totalEmpSanctioned || 0,
      totalEmpCompleted: data.totalEmpCompleted || 0,
      landBudget: data.landBudget?.toString() || '0',
      rrBudget: data.rrBudget?.toString() || '0',
      status: data.status || 0,
      remarks: data.remarks || null,
      tenantId: data.tenantId || 'default-tenant',
      isActive: data.isActive ?? true,
      lockedAt: (data as any).locked_at ? new Date((data as any).locked_at) : null,
      entryTs: data.entryTs ? new Date(Number(data.entryTs) * 1000) : new Date(),
      updtTs: data.updtTs ? new Date(Number(data.updtTs) * 1000) : new Date(),
    })
  }

  async findAll(options?: IProjectQueryOptions): Promise<IPaginatedResult<Project>> {
    const page = options?.page ?? 1
    const pageSize = options?.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const where: any = {}
    
    if (options?.mine_cd) {
      where.eclProjCd = options.mine_cd
    }
    
    if (options?.search) {
      where.OR = [
        { projNm: { contains: options.search, mode: 'insensitive' } },
        { eclProjCd: { contains: options.search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      db.project.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: options?.orderBy ?? { entryTs: 'desc' },
      }),
      db.project.count({ where }),
    ])

    const projects = data.map((p: any) => Project.reconstitute({
      projCd: p.projCd,
      projNm: p.projNm,
      eclProjCd: p.eclProjCd || '',
      projectDesc: p.projectDesc,
      totalApprovedArea: p.totalApprovedArea?.toString() || '0',
      totalAcquiredArea: p.totalAcquiredArea?.toString() || '0',
      totalEmpSanctioned: p.totalEmpSanctioned || 0,
      totalEmpCompleted: p.totalEmpCompleted || 0,
      landBudget: p.landBudget?.toString() || '0',
      rrBudget: p.rrBudget?.toString() || '0',
      status: p.status || 0,
      remarks: p.remarks || null,
      tenantId: p.tenantId || 'default-tenant',
      isActive: p.isActive ?? true,
      entryTs: p.entryTs ? new Date(Number(p.entryTs) * 1000) : new Date(),
      updtTs: p.updtTs ? new Date(Number(p.updtTs) * 1000) : new Date(),
    }))

    return {
      data: projects,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  async findByMineCd(mine_cd: string): Promise<Project | null> {
    const data = await db.project.findFirst({
      where: { eclProjCd: mine_cd },
    })

    if (!data) return null

    return Project.reconstitute({
      projCd: data.projCd,
      projNm: data.projNm,
      eclProjCd: data.eclProjCd || '',
      projectDesc: data.projectDesc,
      totalApprovedArea: data.totalApprovedArea?.toString() || '0',
      totalAcquiredArea: data.totalAcquiredArea?.toString() || '0',
      totalEmpSanctioned: data.totalEmpSanctioned || 0,
      totalEmpCompleted: data.totalEmpCompleted || 0,
      landBudget: data.landBudget?.toString() || '0',
      rrBudget: data.rrBudget?.toString() || '0',
      status: data.status || 0,
      remarks: data.remarks || null,
      tenantId: data.tenantId || 'default-tenant',
      isActive: data.isActive ?? true,
      entryTs: data.entryTs ? new Date(Number(data.entryTs) * 1000) : new Date(),
      updtTs: data.updtTs ? new Date(Number(data.updtTs) * 1000) : new Date(),
    })
  }

  async create(project: Project): Promise<void> {
    const data = project.toPersistence()
    
    await db.project.create({
      data: {
        projCd: data.projCd,
        projNm: data.projNm,
        eclProjCd: data.eclProjCd,
        projectDesc: data.projectDesc,
        totalApprovedArea: data.totalApprovedArea ? new Decimal(data.totalApprovedArea) : null,
        totalAcquiredArea: data.totalAcquiredArea ? new Decimal(data.totalAcquiredArea) : null,
        totalEmpSanctioned: data.totalEmpSanctioned,
        totalEmpCompleted: data.totalEmpCompleted,
        landBudget: data.landBudget ? new Decimal(data.landBudget) : null,
        rrBudget: data.rrBudget ? new Decimal(data.rrBudget) : null,
        status: data.status,
        remarks: data.remarks,
        tenant: data.tenantId ? { connect: { tenantId: data.tenantId } } : undefined,
        isActive: data.isActive,
      }
    })
  }

  async update(project: Project): Promise<void> {
    const data = project.toPersistence()
    
    await db.project.update({
      where: { projCd: data.projCd },
      data: {
        projNm: data.projNm,
        eclProjCd: data.eclProjCd,
        projectDesc: data.projectDesc,
        totalApprovedArea: data.totalApprovedArea ? new Decimal(data.totalApprovedArea) : null,
        totalAcquiredArea: data.totalAcquiredArea ? new Decimal(data.totalAcquiredArea) : null,
        totalEmpSanctioned: data.totalEmpSanctioned,
        totalEmpCompleted: data.totalEmpCompleted,
        landBudget: data.landBudget ? new Decimal(data.landBudget) : null,
        rrBudget: data.rrBudget ? new Decimal(data.rrBudget) : null,
        status: data.status,
        remarks: data.remarks,
        tenant: data.tenantId ? { connect: { tenantId: data.tenantId } } : undefined,
        isActive: data.isActive,
        updtTs: BigInt(Math.floor(Date.now() / 1000))
      }
    })
  }

  async updateMouzas(projectId: string, mouzaLgds: string[]): Promise<void> {
    const project = await db.project.findUnique({ where: { projCd: projectId } });
    if (!project) return;
    
    // Check if a baseline approval exists
    const existingAprv = await db.projAprv.findFirst({ where: { projCd: projectId }, orderBy: { entryTs: 'asc' } });
    
    let aprvCd = existingAprv?.aprvCd;
    if (!existingAprv) {
      aprvCd = BigInt(Date.now());
      await db.projAprv.create({
        data: {
          aprvCd,
          projCd: projectId,
          aprvArea: project.totalApprovedArea,
          empSanc: project.totalEmpSanctioned,
          landCap: project.landBudget,
          rrCap: project.rrBudget,
          aprvDt: new Date(),
          isActive: true,
          remark: 'Baseline Approval',
        }
      });
    }

    if (mouzaLgds && mouzaLgds.length > 0 && aprvCd) {
       for (const lgd of mouzaLgds) {
          const existingLoc = await db.projAprvLocation.findFirst({ where: { aprvCd, mouzaLgd: BigInt(lgd) } });
          if (!existingLoc) {
            const locCode = require('crypto').randomBytes(5).toString('hex').toLowerCase();
            await db.projAprvLocation.create({
              data: {
                aprvLocationCode: locCode,
                aprvCd: aprvCd,
                mouzaLgd: BigInt(lgd),
                approvedArea: project.totalApprovedArea,
              }
            });
          }
       }
    }
  }

  async save(project: Project): Promise<void> {
    const exists = await this.exists(project.id.toString());
    if (exists) {
      await this.update(project);
    } else {
      await this.create(project);
    }
  }

  async updateProjectMouzas(projectId: string, mouzaLgds: bigint[]): Promise<void> {
    await this.updateMouzas(projectId, mouzaLgds.map(String));
  }

  async syncProjectDocuments(projectId: string, fileIds: string[], userId: string): Promise<void> {
    if (!fileIds || fileIds.length === 0) return;
    const { randomUUID } = require('crypto');
    await db.file_attachment.createMany({
      skipDuplicates: true,
      data: fileIds.map(fileId => ({
        id: randomUUID(),
        file_id: fileId,
        entity_type: 'project-master',
        entity_id: projectId,
        module: 'PR_DOC', // distinguishing from CLEARANCE_DGMS etc.
        attached_by: userId,
        updt_ts: new Date()
      }))
    });
  }

  async delete(id: string): Promise<void> {
    await db.project.delete({ where: { projCd: id } })
  }

  async exists(id: string): Promise<boolean> {
    const count = await db.project.count({ where: { projCd: id } })
    return count > 0
  }

  async lock(id: string, user_id: string): Promise<boolean> {
    const result = await db.project.updateMany({
      where: { projCd: id, status: 0 },
      data: { status: 1 },
    })
    return result.count > 0
  }

  // Dashboard-specific query
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
    state_lgd: string | null
    area_cd: string | null
    mouza_lgds: string[]
    locked_at: Date | null
    statutory_clearances: string | null
    boundary: string | null
  }>> {
    // 1. Fetch from new Project table
    const projects = await db.project.findMany({
      orderBy: { entryTs: 'desc' },
      include: {
        approvals: {
          include: { locations: true }
        }
      }
    })

    // 2. We still need legacy stats (mouzas, plots, payrolls) for the dashboard.
    // We'll fetch them from legacy tables where projectId = projCd.
    const allPlots = await db.mst_plot.findMany({ include: { mouza: true } })
    
    // Note: audit logs still reference 'mst_project'
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

    // Group plots by project
    const plotsByProject = allPlots.reduce((acc: any, plot: any) => {
      const pid = plot.land_schedule_item?.land_schedule?.project_id
      if (pid) {
        if (!acc[pid]) acc[pid] = []
        acc[pid].push(plot)
      }
      return acc
    }, {})

    // We also need payrolls. We'll do an aggregate or just fetch all
    const allPayrolls = await db.compensation_payroll.findMany({
      include: { compensation_payroll_line: true }
    })

    const payrollsByProject = allPayrolls.reduce((acc: any, pr: any) => {
      const pid = pr.project_id
      if (pid) {
        if (!acc[pid]) acc[pid] = []
        acc[pid].push(pr)
      }
      return acc
    }, {})

    const uniqueMouzas = new Set<bigint>()
    const uniqueMines = new Set<string>()
    projects.forEach(p => {
      if (p.projCd) uniqueMines.add(p.projCd)
      p.approvals.forEach((a: any) => {
        if (a.locations) {
          a.locations.forEach((l: any) => {
            if (l.mouzaLgd) uniqueMouzas.add(l.mouzaLgd)
          })
        }
      })
    })

    const mouzas = await db.mouza_master.findMany({
      where: { mouza_lgd: { in: Array.from(uniqueMouzas) } }
    })
    const mouzaMap = new Map(mouzas.map(m => [m.mouza_lgd.toString(), m]))

    const mines = await db.mine_master.findMany({
      where: { mine_cd: { in: Array.from(uniqueMines) } }
    })
    const mineMap = new Map(mines.map(m => [m.mine_cd, m]))

    return projects.map((p: any) => {
      const projPlots = plotsByProject[p.projCd] || []
      const totalAcquiredAreaNum = projPlots.reduce((sum: number, pl: any) => sum + Number(pl.area_acres), 0)
      
      const project = Project.reconstitute({
        projCd: p.projCd,
        projNm: p.projNm,
        eclProjCd: p.eclProjCd || '',
        projectDesc: p.projectDesc,
        totalApprovedArea: p.totalApprovedArea?.toString() || '0',
        totalAcquiredArea: totalAcquiredAreaNum.toString(),
        totalEmpSanctioned: p.totalEmpSanctioned || 0,
        totalEmpCompleted: p.totalEmpCompleted || 0,
        landBudget: p.landBudget?.toString() || '0',
        rrBudget: p.rrBudget?.toString() || '0',
        status: p.status || 0,
        remarks: p.remarks || null,
        tenantId: p.tenantId || 'default-tenant',
        isActive: p.isActive ?? true,
        entryTs: p.entryTs ? new Date(Number(p.entryTs) * 1000) : new Date(),
        updtTs: p.updtTs ? new Date(Number(p.updtTs) * 1000) : new Date(),
      })

      const projPayrolls = payrollsByProject[p.projCd] || []
      let totalDisbursed = new Decimal(0)
      projPayrolls.forEach((pr: any) => {
        if (pr.status === 2 && pr.compensation_payroll_line) {
          pr.compensation_payroll_line.forEach((line: any) => {
            totalDisbursed = totalDisbursed.add(new Decimal(line.amount?.toString() || 0))
          })
        }
      })

      const budgetCeiling = new Decimal(p.landBudget || 0).add(new Decimal(p.rrBudget || 0))
      let budgetUtilization = 0
      if (budgetCeiling.greaterThan(0)) {
        budgetUtilization = totalDisbursed.dividedBy(budgetCeiling).times(100).toNumber()
      }

      // Board Approvals mapping
      const boardApprovals = auditLogs
        .filter(log => log.entity_id === p.projCd)
        .map(log => {
          let remarks = log.description || ''
          let fileId
          let fileName
          try {
            if (log.new_values && typeof log.new_values === 'object') {
              const val = log.new_values as any
              if (val.board_approval_doc_id) {
                fileId = val.board_approval_doc_id
                const att = fileAttachments.find(f => f.file_id === fileId)
                if (att?.file_record?.file_version?.[0]) {
                  fileName = att.file_record.file_version[0].file_name
                }
              }
              if (val.remarks) {
                remarks = val.remarks
              }
            }
          } catch (e) {}
          return {
            id: log.id,
            date: log.entry_ts ? log.entry_ts.toISOString() : new Date().toISOString(),
            remarks,
            file_id: fileId,
            file_name: fileName
          }
        })

      // Extract locations from the latest approval if any
      const approvals = p.approvals || []
      const latestApproval = approvals.length > 0 ? approvals[approvals.length - 1] : null
      let firstMouza = null
      const mouzaLgds: string[] = []
      
      if (latestApproval && latestApproval.locations) {
        latestApproval.locations.forEach((loc: any) => {
          if (!firstMouza) firstMouza = loc
          mouzaLgds.push(loc.mouzaLgd?.toString() || '')
        })
      }

      let district_lgd: string | null = null
      let block_lgd: string | null = null
      let state_lgd: string | null = null
      
      if (firstMouza && firstMouza.mouzaLgd) {
        const mm = mouzaMap.get(firstMouza.mouzaLgd.toString()) as any
        if (mm) {
          district_lgd = mm.district_lgd?.toString() || null
          block_lgd = mm.block_lgd?.toString() || null
          state_lgd = mm.state_lgd?.toString() || null
        }
      }

      let area_cd: string | null = firstMouza?.areaCd || null
      if (!area_cd && p.projCd) {
        const mm = mineMap.get(p.projCd) as any
        if (mm) area_cd = mm.area_cd || null
      }

      const prDocs = fileAttachments.filter(f => f.entity_id === p.projCd).map(f => {
        const latestVersion = f.file_record.file_version?.[0];
        return {
          id: f.file_id,
          file_name: f.file_record.original_name,
          file_size_kb: latestVersion ? Math.round(Number(latestVersion.size_bytes) / 1024) : 0,
          mime_type: latestVersion?.mime_type || 'application/octet-stream',
          virus_scan_status: 'clean'
        };
      })

      const approvedArea = p.totalApprovedArea ? new Decimal(p.totalApprovedArea.toString()) : new Decimal(0);
      const acquiredArea = new Decimal(totalAcquiredAreaNum);
      const areaUtilization = approvedArea.greaterThan(0) ? acquiredArea.dividedBy(approvedArea).times(100).toNumber() : 0;

      return {
        project,
        payrollCount: projPayrolls.length,
        totalDisbursed,
        budgetUtilization,
        plots: projPlots.map((pl: any) => ({
          plot_id: pl.id,
          plot_no: pl.plot_number,
          plot_area: Number(pl.area_acres),
          mouza_name: pl.mouza?.name || '',
          land_class: pl.land_class || ''
        })),
        breachedProposals: [],
        boardApprovals,
        district_lgd,
        block_lgd,
        state_lgd,
        area_cd,
        mouza_lgds: mouzaLgds,
        pr_docs: prDocs as any,
        locked_at: p.status === 1 ? (p.updtTs ? new Date(Number(p.updtTs) * 1000) : new Date()) : null,
        statutory_clearances: p.statutoryClearances ? String(p.statutoryClearances) : null,
        total_acquired_area: totalAcquiredAreaNum,
        areaUtilization,
        boundary: p.boundary || null,   // ← boundary JSON string from DB
      }
    })
  }
}
