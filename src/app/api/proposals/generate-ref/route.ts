import { NextRequest, NextResponse } from 'next/server'
import { generateProposalRefNo } from '@/shared/utils/proposal-ref-generator'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { project_id, acq_mode_id, is_draft } = await req.json()

    if (!project_id || (!is_draft && !acq_mode_id)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch the project to get ecl_proj_cd and area_cd
    const project = await db.project.findUnique({
      where: { projCd: project_id },
      include: {
        project_mines: true
      }
    })

    if (!project || !project.eclProjCd) {
      return NextResponse.json({ error: 'Project not found or missing eclProjCd' }, { status: 404 })
    }

    // Get area_cd from the mine
    let areaCd = 'UNK'
    if (project.project_mines && project.project_mines.length > 0) {
      const mine = await db.mine_master.findUnique({
        where: { mine_cd: project.project_mines[0].mine_cd }
      })
      if (mine && mine.area_cd) {
        areaCd = mine.area_cd
      }
    }

    const refNo = await generateProposalRefNo(project.eclProjCd, acq_mode_id ? Number(acq_mode_id) : null, areaCd, is_draft)

    return NextResponse.json({ refNo })
  } catch (error: any) {
    console.error('Error generating proposal ref no:', error)
    return NextResponse.json({ error: 'Failed to generate proposal ref no' }, { status: 500 })
  }
}
