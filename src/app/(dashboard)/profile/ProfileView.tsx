'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { SectionCard } from '@/components/coalrr'
import { Button } from '@/components/ui/button'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/shared/components/ui/separator'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  User, Mail, Phone, Briefcase, Building2, MapPin, ShieldCheck,
  KeyRound, Pencil, Loader2, CalendarDays, Globe, Lock, ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────
interface ProfileUser {
  id: string
  name: string
  email: string | null
  mobile: string | null
  designation: string | null
  role: string
  portal: string
  mine_cd: string | null
  entry_ts: Date
}

interface Scope {
  scope_level: string
  area_cd: string | null
  mine_cd: string | null
  effective_from: Date
  effective_to: Date | null
  area: { area_cd: string; area_en: string } | null
  mine: { mine_cd: string; mine_en: string } | null
}

interface Role {
  id: string
  name: string
  display_name: string | null
}

interface ProfileViewProps {
  initialUser: ProfileUser
  scope: Scope | null
  roles: Role[]
  readOnly?: boolean
}

// ── Schemas ──────────────────────────────────────────────────────────────────
const bioSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  designation: z.string().optional().or(z.literal('')),
  mobile: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Required'),
  new_password: z.string().min(8, 'Minimum 8 characters'),
  confirm_password: z.string().min(1, 'Required'),
}).refine(d => d.new_password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

// ── Edit Bio Dialog ───────────────────────────────────────────────────────────
function EditBioDialog({ user, onSuccess }: { user: ProfileUser; onSuccess: (u: Partial<ProfileUser>) => void }) {
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const form = useForm<z.infer<typeof bioSchema>>({
    resolver: zodResolver(bioSchema),
    defaultValues: {
      name: user.name,
      designation: user.designation || '',
      mobile: user.mobile || '',
      email: user.email || '',
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: user.name,
        designation: user.designation || '',
        mobile: user.mobile || '',
        email: user.email || '',
      })
    }
  }, [open, user, form])

  async function onSubmit(values: z.infer<typeof bioSchema>) {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to update')
      toast.success('Profile updated successfully')
      setOpen(false)
      onSuccess(json.user)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your display name, contact details and designation.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="designation" render={({ field }) => (
              <FormItem>
                <FormLabel>Designation</FormLabel>
                <FormControl><Input placeholder="e.g. Unit Surveyor" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" placeholder="you@coalrr.gov.in" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="mobile" render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile</FormLabel>
                <FormControl><Input placeholder="+91..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ── Change Password Dialog ────────────────────────────────────────────────────
function ChangePasswordDialog() {
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  })

  React.useEffect(() => {
    if (open) form.reset({ current_password: '', new_password: '', confirm_password: '' })
  }, [open, form])

  async function onSubmit(values: z.infer<typeof passwordSchema>) {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: values.current_password,
          new_password: values.new_password,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to change password')
      toast.success('Password changed successfully')
      setOpen(false)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Lock className="h-4 w-4" />
          Change Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="current_password" render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl><Input type="password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Separator />
            <FormField control={form.control} name="new_password" render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl><Input type="password" placeholder="Minimum 8 characters" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="confirm_password" render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl><Input type="password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : 'Update Password'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ── InfoRow ────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, mono }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('text-sm font-medium', mono && 'font-mono')}>{value || <span className="text-muted-foreground">—</span>}</p>
      </div>
    </div>
  )
}

// ── Main View ────────────────────────────────────────────────────────────────
export function ProfileView({ initialUser, scope, roles, readOnly = false }: ProfileViewProps) {
  const router = useRouter()
  const [user, setUser] = React.useState(initialUser)

  React.useEffect(() => {
    setUser(initialUser)
  }, [initialUser])

  const handleBioSave = (updatedUser: Partial<ProfileUser>) => {
    setUser(prev => ({ ...prev, ...updatedUser }))
    router.refresh()
  }

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const joinedDate = new Date(user.entry_ts).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{readOnly ? 'User Profile' : 'My Profile'}</h2>
            <p className="text-sm text-muted-foreground">{readOnly ? `Viewing profile details for ${user.name}` : 'Manage your personal details and security settings.'}</p>
          </div>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <EditBioDialog user={user} onSuccess={handleBioSave} />
            <ChangePasswordDialog />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left: Avatar + identity ─────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-6">
          {/* Avatar card */}
          <div className="rounded-xl border bg-card p-6 flex flex-col items-center text-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-2xl font-bold">
              {initials}
            </div>
            <div>
              <p className="text-lg font-bold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.designation || 'No designation set'}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline" className="text-xs capitalize">{user.portal} Portal</Badge>
              <Badge className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-0">
                {user.role}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              Joined {joinedDate}
            </p>
          </div>

          {/* Assigned Roles */}
          <SectionCard title="Assigned Roles" icon={ShieldCheck} description={`${roles.length} role${roles.length !== 1 ? 's' : ''} assigned`}>
            {roles.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No roles assigned yet.</p>
            ) : (
              <div className="space-y-2 pt-1">
                {roles.map(role => (
                  <div key={role.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{role.display_name || role.name}</p>
                      <p className="text-xs font-mono text-muted-foreground">{role.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Right: Details ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <SectionCard title="Personal Information" icon={User} description="Your basic contact and identity details">
            <div className="divide-y">
              <InfoRow icon={User} label="Full Name" value={user.name} />
              <InfoRow icon={Briefcase} label="Designation" value={user.designation} />
              <InfoRow icon={Mail} label="Email Address" value={user.email} />
              <InfoRow icon={Phone} label="Mobile Number" value={user.mobile} />
              <InfoRow icon={Globe} label="Portal" value={<span className="capitalize">{user.portal}</span>} />
              <InfoRow icon={KeyRound} label="System Role" value={user.role} mono />
            </div>
          </SectionCard>

          {/* Org Scope */}
          <SectionCard title="Organisational Scope" icon={MapPin} description="Your assigned area and mine jurisdiction">
            {!scope ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
                <MapPin className="h-8 w-8 opacity-30" />
                <p className="text-sm">No active scope assignment found.</p>
                <p className="text-xs">Contact your administrator to assign an area or mine.</p>
              </div>
            ) : (
              <div className="divide-y">
                <InfoRow
                  icon={Globe}
                  label="Scope Level"
                  value={
                    <Badge variant="outline" className="capitalize font-mono text-xs">
                      {scope.scope_level?.replace('_', ' ') || 'Unknown'}
                    </Badge>
                  }
                />
                {scope.area && (
                  <InfoRow
                    icon={MapPin}
                    label="Area"
                    value={`${scope.area.area_en} (${scope.area.area_cd})`}
                  />
                )}
                {scope.mine && (
                  <InfoRow
                    icon={Building2}
                    label="Mine"
                    value={`${scope.mine.mine_en} (${scope.mine.mine_cd})`}
                  />
                )}
                {user.mine_cd && !scope.mine && (
                  <InfoRow icon={Building2} label="Mine Code (User)" value={user.mine_cd} mono />
                )}
                <InfoRow
                  icon={CalendarDays}
                  label="Effective From"
                  value={new Date(scope.effective_from).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                />
                {scope.effective_to && (
                  <InfoRow
                    icon={CalendarDays}
                    label="Effective To"
                    value={new Date(scope.effective_to).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  />
                )}
              </div>
            )}
          </SectionCard>

          {/* Security */}
          {!readOnly && (
            <SectionCard title="Security" icon={Lock} description="Manage your login password">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Login Password</p>
                  <p className="text-xs text-muted-foreground">Last changed: date not tracked. Change regularly to stay secure.</p>
                </div>
                <ChangePasswordDialog />
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  )
}
