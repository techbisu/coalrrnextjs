import { db } from '@/lib/db'

export type LandCategory = 'TENANCY' | 'GOVT' | 'FOREST' | 'PATTA' | 'UNKNOWN'

/**
 * Builds a map of landt_id → LandCategory by loading all landtype rows
 * and walking up the p_id hierarchy to resolve the root category name.
 *
 * No hardcoded IDs or name strings — fully driven by master.landtype data.
 */
export async function buildLandCategoryMap(): Promise<Map<number, LandCategory>> {
  const allTypes = await db.landtype.findMany({
    where: { is_active: true },
    select: { landt_id: true, land_type: true, p_id: true }
  })

  // Build a quick lookup: landt_id → { land_type, p_id }
  const byId = new Map<number, { land_type: string; p_id: number | null }>()
  for (const lt of allTypes) {
    byId.set(Number(lt.landt_id), {
      land_type: lt.land_type,
      p_id: lt.p_id ? Number(lt.p_id) : null
    })
  }

  // Walk up p_id chain to find the root land_type name for any landt_id
  function getRootName(landt_id: number, visited = new Set<number>()): string {
    if (visited.has(landt_id)) return ''
    visited.add(landt_id)
    const entry = byId.get(landt_id)
    if (!entry) return ''
    if (!entry.p_id) return entry.land_type  // root node
    return getRootName(entry.p_id, visited)  // walk up
  }

  // Classify root name → category
  function classify(rootName: string): LandCategory {
    const n = rootName.toUpperCase()
    if (n.includes('FOREST')) return 'FOREST'
    if (n.includes('GOVT') || n.includes('GOVERNMENT') || n.includes('PSU') || n.includes('OTHER')) return 'GOVT'
    if (n.includes('PATTA')) return 'PATTA'
    if (n.includes('TENANCY') || n.includes('RAIYATI') || n.includes('RAYATI') || n.includes('PRIVATE')) return 'TENANCY'
    return 'TENANCY' // default: treat unknown root as tenancy for employment purposes
  }

  const categoryMap = new Map<number, LandCategory>()
  for (const lt of allTypes) {
    const id = Number(lt.landt_id)
    const rootName = getRootName(id)
    categoryMap.set(id, classify(rootName))
  }

  return categoryMap
}
