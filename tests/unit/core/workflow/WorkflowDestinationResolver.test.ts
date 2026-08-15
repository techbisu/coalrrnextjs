import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorkflowDestinationResolver } from '@/core/workflow/services/WorkflowDestinationResolver'
import { db } from '@/lib/db'

vi.mock('@/lib/db', () => ({
  db: {
    area: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    mine: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    user_org_scope: {
      findMany: vi.fn(),
    },
  },
}))

describe('WorkflowDestinationResolver Unit Tests', () => {
  let resolver: WorkflowDestinationResolver

  beforeEach(() => {
    vi.clearAllMocks()
    resolver = new WorkflowDestinationResolver()
  })

  describe('resolveUserAllowedScopes', () => {
    it('should grant global scope for HQ / SuperAdmin role', async () => {
      vi.mocked((db as any).area.findMany).mockResolvedValue([{ area_cd: 'AREA_A' }, { area_cd: 'AREA_B' }] as any)
      vi.mocked((db as any).mine.findMany).mockResolvedValue([{ mine_cd: 'MINE_1' }, { mine_cd: 'MINE_2' }] as any)

      const scope = await resolver.resolveUserAllowedScopes('usr_admin', 'super_admin')

      expect(scope.isGlobal).toBe(true)
      expect(scope.allowedAreaCds).toEqual(['AREA_A', 'AREA_B'])
      expect(scope.allowedMineCds).toEqual(['MINE_1', 'MINE_2'])
    })

    it('should constrain allowed scopes for area-scoped user', async () => {
      vi.mocked((db as any).user_org_scope.findMany).mockResolvedValue([
        { scope_level: 'AREA', area_cd: 'AREA_A', mine_cd: null }
      ] as any)

      vi.mocked((db as any).mine.findMany).mockResolvedValue([
        { mine_cd: 'MINE_1' },
        { mine_cd: 'MINE_2' }
      ] as any)

      const scope = await resolver.resolveUserAllowedScopes(101, 'area_officer')

      expect(scope.isGlobal).toBe(false)
      expect(scope.allowedAreaCds).toEqual(['AREA_A'])
      expect(scope.allowedMineCds).toEqual(['MINE_1', 'MINE_2'])
    })
  })

  describe('resolveDestinationMetadata', () => {
    it('should resolve FORCED routing metadata with recipient.required = false', async () => {
      vi.mocked((db as any).area.findMany).mockResolvedValue([{ area_cd: 'AREA_A' }] as any)
      vi.mocked((db as any).mine.findMany).mockResolvedValue([{ mine_cd: 'MINE_1' }] as any)

      const transition = {
        name: 'submit_to_area',
        label: 'Submit to Area Office',
        from: 'Drafting',
        to: 'Section4Area',
        role: 'area_office',
        routingType: 'FORCED'
      }

      const meta = await resolver.resolveDestinationMetadata(transition, 'usr_admin', 'admin')

      expect(meta.recipient.required).toBe(false)
      expect(meta.destination.state).toBe('Section4Area')
      expect(meta.reason.required).toBe(false)
    })

    it('should resolve USER_CHOICE routing metadata with recipient.required = true', async () => {
      vi.mocked((db as any).user_org_scope.findMany).mockResolvedValue([
        { scope_level: 'AREA', area_cd: 'AREA_A', mine_cd: null }
      ] as any)
      vi.mocked((db as any).mine.findMany).mockResolvedValue([{ mine_cd: 'MINE_1' }] as any)

      const transition = {
        name: 'forward_to_unit_reconcile',
        label: 'Forward to Unit',
        from: 'Section4Area',
        to: 'JointReconciliation',
        role: 'unit_office',
        routingType: 'USER_CHOICE'
      }

      const meta = await resolver.resolveDestinationMetadata(transition, 101, 'area_office')

      expect(meta.recipient.required).toBe(true)
      expect(meta.recipient.selectionType).toBe('CASCADE_AREA_MINE_UNIT')
    })

    it('should flag reason.required = true for Return transitions', async () => {
      vi.mocked((db as any).area.findMany).mockResolvedValue([{ area_cd: 'AREA_A' }] as any)
      vi.mocked((db as any).mine.findMany).mockResolvedValue([{ mine_cd: 'MINE_1' }] as any)

      const transition = {
        name: 'return_to_unit',
        label: 'Return to Unit',
        from: 'Section4Area',
        to: 'Drafting',
        role: 'unit_office',
        routingType: 'FORCED'
      }

      const meta = await resolver.resolveDestinationMetadata(transition, 'usr_admin', 'admin')

      expect(meta.reason.required).toBe(true)
    })
  })

  describe('validateDestination', () => {
    it('should reject selection when destination is required but missing', async () => {
      const transition = {
        name: 'forward_to_unit',
        label: 'Forward to Unit',
        from: 'Section4Area',
        to: 'JointReconciliation',
        role: 'unit_office',
        routingType: 'USER_CHOICE'
      }

      const res = await resolver.validateDestination({
        userId: 'usr_admin',
        userRole: 'admin',
        transition
      })

      expect(res.ok).toBe(false)
      expect(res.reason).toContain('Destination selection (Area / Mine) is required')
    })

    it('should reject mine selection outside user scope', async () => {
      vi.mocked((db as any).user_org_scope.findMany).mockResolvedValue([
        { scope_level: 'AREA', area_cd: 'AREA_A', mine_cd: 'MINE_1' }
      ] as any)
      vi.mocked((db as any).mine.findMany).mockResolvedValue([{ mine_cd: 'MINE_1' }] as any)

      const transition = {
        name: 'forward_to_unit',
        label: 'Forward to Unit',
        from: 'Section4Area',
        to: 'JointReconciliation',
        role: 'unit_office',
        routingType: 'USER_CHOICE'
      }

      const res = await resolver.validateDestination({
        userId: 101,
        userRole: 'area_office',
        area_cd: 'AREA_A',
        mine_cd: 'MINE_FORBIDDEN',
        transition
      })

      expect(res.ok).toBe(false)
      expect(res.reason).toContain('outside user scope')
    })

    it('should reject mine that does not belong to selected Area (hierarchy check)', async () => {
      vi.mocked((db as any).area.findMany).mockResolvedValue([{ area_cd: 'AREA_A' }] as any)
      vi.mocked((db as any).mine.findMany).mockResolvedValue([{ mine_cd: 'MINE_1' }] as any)

      vi.mocked((db as any).area.findUnique).mockResolvedValue({ area_cd: 'AREA_A', is_active: true } as any)
      vi.mocked((db as any).mine.findUnique).mockResolvedValue({ mine_cd: 'MINE_1', area_cd: 'AREA_DIFFERENT', is_active: true } as any)

      const transition = {
        name: 'forward_to_unit',
        label: 'Forward to Unit',
        from: 'Section4Area',
        to: 'JointReconciliation',
        role: 'unit_office',
        routingType: 'USER_CHOICE'
      }

      const res = await resolver.validateDestination({
        userId: 'usr_admin',
        userRole: 'admin',
        area_cd: 'AREA_A',
        mine_cd: 'MINE_1',
        transition
      })

      expect(res.ok).toBe(false)
      expect(res.reason).toContain('Hierarchy error: Mine \'MINE_1\' does not belong to Area \'AREA_A\'')
    })

    it('should accept valid, scope-compliant, and hierarchy-matched destination payload', async () => {
      vi.mocked((db as any).area.findMany).mockResolvedValue([{ area_cd: 'AREA_A' }] as any)
      vi.mocked((db as any).mine.findMany).mockResolvedValue([{ mine_cd: 'MINE_1' }] as any)

      vi.mocked((db as any).area.findUnique).mockResolvedValue({ area_cd: 'AREA_A', is_active: true } as any)
      vi.mocked((db as any).mine.findUnique).mockResolvedValue({ mine_cd: 'MINE_1', area_cd: 'AREA_A', is_active: true } as any)

      const transition = {
        name: 'forward_to_unit',
        label: 'Forward to Unit',
        from: 'Section4Area',
        to: 'JointReconciliation',
        role: 'unit_office',
        routingType: 'USER_CHOICE'
      }

      const res = await resolver.validateDestination({
        userId: 'usr_admin',
        userRole: 'admin',
        area_cd: 'AREA_A',
        mine_cd: 'MINE_1',
        transition
      })

      expect(res.ok).toBe(true)
    })
  })
})
