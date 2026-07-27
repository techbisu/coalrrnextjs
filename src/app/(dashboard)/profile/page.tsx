import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { ProfileView } from './ProfileView'
import { authConfig } from '@/core/config/auth.config'

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
      otp_enabled: true
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

  const notificationPrefs = await db.notification_preference.findMany({
    where: { user_id: user.id.toString() },
    select: { channel: true, is_enabled: true }
  })

  return (
    <ProfileView
      initialUser={{ ...fullUser!, id: fullUser!.id.toString() }}
      scope={activeScope as any}
      roles={assignedRoles.map(r => r.role)}
      notificationPrefs={notificationPrefs}
      initialOtpEnabled={fullUser?.otp_enabled ?? true}
      globalOtpEnabled={authConfig.globalOtpEnabled}
    />
  )
}
