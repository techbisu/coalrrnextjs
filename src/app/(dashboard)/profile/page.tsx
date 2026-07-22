import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { ProfileView } from './ProfileView'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My Profile — COALRR',
}

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/api/auth/login')

  // Load full profile data server-side
  const fullUser = await db.user.findUnique({
    where: { id: parseInt(user.id, 10) },
    select: {
      id: true, name: true, email: true, mobile: true,
      designation: true, role: true, portal: true, mine_cd: true,
      entry_ts: true,
    }
  })

  const activeScope = await db.user_org_scope.findFirst({
    where: { user_id: parseInt(user.id, 10), effective_to: null },
    include: {
      area: { select: { area_cd: true, area_en: true } },
      mine: { select: { mine_cd: true, mine_en: true } },
    },
    orderBy: { effective_from: 'desc' }
  })

  const assignedRoles = await db.model_has_role.findMany({
    where: { model_id: user.id.toString(), model_type: 'user' },
    include: { role: { select: { id: true, name: true, display_name: true } } }
  })

  return (
    <ProfileView
      initialUser={fullUser!}
      scope={activeScope}
      roles={assignedRoles.map(r => r.role)}
    />
  )
}
