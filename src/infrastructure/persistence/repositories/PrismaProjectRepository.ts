import { db } from '@/lib/db'
import { Project, IProjectRepository, IProjectQueryOptions } from '@/domain'
import { IPaginatedResult, IQueryOptions } from '@/core/interfaces'
import Decimal from 'decimal.js'
import { PROJECT_CONFIG } from '@/core/config/project.config'

export class PrismaProjectRepository implements IProjectRepository {
  async findByName(name: string): Promise<Project | null> {
    const project = await db.project.findFirst({ where: { projNm: name } });
    if (!project) return null;
    return this.findById(project.projCd);
  }

  async findByMineCode(mine_cd: string, options?: IQueryOptions): Promise<IPaginatedResult<Project>> {
    // Basic implementation since we just need to satisfy the interface for now
    const limit = options?.pageSize || 10;
    const page = options?.page || 1;
    const offset = (page - 1) * limit;

    const projects = await db.project.findMany({
      take: limit,
      skip: offset,
      // Need to find projects that have locations matching this mine_cd
      where: {
        approvals: {
          some: {
            locations: {
              some: {
                mineCd: mine_cd
              }
            }
          }
        }
      }
    });
    
    const count = await db.project.count({
      where: {
        approvals: {
          some: {
            locations: {
              some: {
                mineCd: mine_cd
              }
            }
          }
        }
      }
    });

    const projectEntities = await Promise.all(projects.map(p => this.findById(p.projCd)));
    
    return {
      data: projectEntities.filter((p): p is Project => p !== null),
      total: count,
      page: page,
      pageSize: limit,
      totalPages: Math.ceil(count / limit)
    };
  }
  
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
      include: {
        approvals: {
          include: {
            locations: true
          }
        }
      }
    })

    if (!data) return null

    const uniqueMines = new Set<string>()
    data.approvals?.forEach(aprv => {
      aprv.locations?.forEach(loc => {
        if (loc.mineCd) {
          uniqueMines.add(loc.mineCd)
        }
      })
    })

    return Project.reconstitute({
      projCd: data.projCd,
      projNm: data.projNm,
      eclProjCd: data.eclProjCd || '',
      mineCds: Array.from(uniqueMines),
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
      include: {
        approvals: {
          include: { locations: true }
        }
      }
    })

    if (!data) return null

    const uniqueMines = new Set<string>()
    data.approvals?.forEach(aprv => {
      aprv.locations?.forEach(loc => {
        if (loc.mineCd) {
          uniqueMines.add(loc.mineCd)
        }
      })
    })

    return Project.reconstitute({
      projCd: data.projCd,
      projNm: data.projNm,
      eclProjCd: data.eclProjCd || '',
      mineCds: Array.from(uniqueMines),
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

  async updateLocations(projectId: string, mineCds: string[], mouzaLgds: string[]): Promise<void> {
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

    if (mineCds && mineCds.length > 0 && aprvCd) {
       for (const mine of mineCds) {
          const existingLoc = await db.projAprvLocation.findFirst({ where: { aprvCd, mineCd: mine, mouzaLgd: BigInt(0) } });
          if (!existingLoc) {
            const locCode = require('crypto').randomBytes(5).toString('hex').toLowerCase();
            await db.projAprvLocation.create({
              data: {
                aprvLocationCode: locCode,
                aprvCd: aprvCd,
                mineCd: mine,
                mouzaLgd: BigInt(0),
                approvedArea: project.totalApprovedArea ?? undefined,
              }
            });
          }
       }
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
                approvedArea: project.totalApprovedArea ?? undefined,
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

  async updateProjectLocations(projectId: string, mineCds: string[], mouzaLgds: bigint[]): Promise<void> {
    await this.updateLocations(projectId, mineCds, mouzaLgds.map(String));
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

  // Deletes the project and its related records in a transaction
  async delete(id: string): Promise<void> {
    await db.$transaction(async (tx) => {
      // 1. Get all approvals for this project to delete their locations
      const approvals = await tx.projAprv.findMany({
        where: { projCd: id },
        select: { aprvCd: true }
      })

      const aprvCds = approvals.map(a => a.aprvCd)

      // 2. Delete locations associated with those approvals
      if (aprvCds.length > 0) {
        await tx.projAprvLocation.deleteMany({
          where: { aprvCd: { in: aprvCds } }
        })
      }

      // 3. Delete approvals
      await tx.projAprv.deleteMany({
        where: { projCd: id }
      })

      // 4. Delete file attachments associated with the project
      await tx.file_attachment.deleteMany({
        where: { entity_id: id }
      })

      // 5. Delete the project itself
      await tx.project.delete({
        where: { projCd: id }
      })
    })
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
  async getDashboardData(options?: { scope?: any }): Promise<Array<{
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
    // Apply scope filter
    const where: any = {}
    if (options?.scope) {
      if (options.scope.level === 'AREA') {
        const areaMines = await db.mine_master.findMany({
          where: { area_cd: { in: options.scope.areaIds } },
          select: { mine_cd: true }
        });
        where.projCd = { in: areaMines.map((m: any) => m.mine_cd) };
      } else if (options.scope.level === 'UNIT') {
        const mineCds = Object.values(options.scope.unitsByArea).flat() as string[];
        where.projCd = { in: mineCds };
      }
    }

    // 1. Fetch from new Project table
    const projects = await db.project.findMany({
      where,
      orderBy: { entryTs: 'desc' },
      include: {
        approvals: {
          include: { locations: true }
        }
      }
    })

    // 2. Fetch plots from plot_schedule via acq_proposal
    const allPlots = await db.plot_schedule.findMany({
      include: {
        acq_proposal: {
          select: { proj_cd: true }
        },
        mouza_master: true
      }
    })
    
    const fileAttachments = await db.file_attachment.findMany({
      where: { entity_type: 'project-master' },
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
      const pid = plot.acq_proposal?.proj_cd
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

    const areas = await db.area_master.findMany()
    const areaMap = new Map(areas.map(a => [a.area_cd, a]))

    return projects.map((p: any) => {
      const projPlots = plotsByProject[p.projCd] || []
      const totalAcquiredAreaNum = projPlots.reduce((sum: number, pl: any) => sum + Number(pl.to_be_acquired_area || 0), 0)
      
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

      // Board Approvals mapping removed as audit_log is gone
      const boardApprovals: any[] = []

      // Extract locations from the latest approval if any
      const approvals = p.approvals || []
      const latestApproval = approvals.length > 0 ? approvals[approvals.length - 1] : null
      let firstMouza: any = null
      const mouzaLgds: string[] = []
      const mineCds: string[] = []
      
      if (latestApproval && latestApproval.locations) {
        latestApproval.locations.forEach((loc: any) => {
          if (loc.mouzaLgd?.toString() === '0' && loc.mineCd) {
            mineCds.push(loc.mineCd)
          } else if (loc.mouzaLgd?.toString() !== '0') {
            if (!firstMouza) firstMouza = loc
            mouzaLgds.push(loc.mouzaLgd?.toString() || '')
          }
        })
      }

      let district_lgd: string[] = []
      let block_lgd: string[] = []
      let state_lgd: string | null = null
      
      if (mouzaLgds.length > 0) {
        const dSet = new Set<string>()
        const bSet = new Set<string>()
        mouzaLgds.forEach(lgd => {
          const mm = mouzaMap.get(lgd) as any
          if (mm) {
            if (mm.district_lgd) dSet.add(mm.district_lgd.toString())
            if (mm.block_lgd) bSet.add(mm.block_lgd.toString())
            if (!state_lgd && mm.state_lgd) state_lgd = mm.state_lgd.toString()
          }
        })
        district_lgd = Array.from(dSet)
        block_lgd = Array.from(bSet)
      }

      let area_cd: string | null = firstMouza?.areaCd || null
      if (!area_cd) {
        const lookupCode = mineCds.length > 0 ? mineCds[0] : p.projCd
        if (lookupCode) {
          const mm = mineMap.get(lookupCode) as any
          if (mm) area_cd = mm.area_cd || null
        }
      }

      if (!state_lgd && area_cd) {
        const am = areaMap.get(area_cd) as any
        if (am && am.state_lgd) state_lgd = am.state_lgd.toString()
      }

      const prDocs = fileAttachments.filter(f => f.entity_id === p.projCd).map(f => {
        const latestVersion = f.file_record?.file_version?.[0];
        return {
          id: f.file_id,
          file_name: f.file_record?.original_name || 'Document',
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
          id: pl.schedule_id?.toString() || crypto.randomUUID(),
          plot_number: pl.plot_no,
          area_acres: pl.to_be_acquired_area?.toString() || '0',
          mouza: pl.mouza_master?.mouza_name || '',
          land_type: pl.plot_ty || '',
          exhausted_area_for_jobs: '0',
          remaining_job_quota: 0
        })),
        breachedProposals: [],
        boardApprovals,
        district_lgd: district_lgd[0] || null,
        block_lgd: block_lgd[0] || null,
        state_lgd,
        area_cd,
        mine_cds: mineCds.length > 0 ? mineCds : [p.projCd],
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
