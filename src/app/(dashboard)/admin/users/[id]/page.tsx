import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { ProfileView } from '@/app/(dashboard)/profile/ProfileView'
import { authorizeApi } from '@/authorization/middleware/authorize'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'User Profile — COALRR Admin',
}

export default async function AdminUserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  // Check admin authorization
  const auth = await authorizeApi('role.manage')
  if (auth.error) redirect('/')

  const { id } = await params

  // Load full profile data server-side
  const fullUser = await db.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, mobile: true,
      designation: true, role: true, portal: true, mine_cd: true,
      entry_ts: true,
    }
  })

  if (!fullUser) redirect('/admin/users')

  const activeScope = await db.user_org_scope.findFirst({
    where: { user_id: id, effective_to: null },
    include: {
      area: { select: { area_cd: true, area_en: true } },
      mine: { select: { mine_cd: true, mine_en: true } },
    },
    orderBy: { effective_from: 'desc' }
  })

  const assignedRoles = await db.model_has_role.findMany({
    where: { model_id: id, model_type: 'user' },
    include: { role: { select: { id: true, name: true, display_name: true } } }
  })

  return (
    <ProfileView
      initialUser={fullUser!}
      scope={activeScope}
      roles={assignedRoles.map(r => r.role)}
      readOnly={true}
    />
  )
}
