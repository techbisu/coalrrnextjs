'use client'

import * as React from 'react'
import { useCoalrr } from '@/components/coalrr/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Mountain, ShieldCheck, Users, Mail, Phone, Lock, Fingerprint, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Portal = 'ecl' | 'public'
type Mode = 'login' | 'register'

export function AuthView() {
  const [portal, setPortal] = React.useState<Portal>('ecl')
  const [mode, setMode] = React.useState<Mode>('login')
  const [loading, setLoading] = React.useState(false)
  const { setUser, setAuthChecked, setView } = useCoalrr()
  const [eclForm, setEclForm] = React.useState({ email: '', password: '' })
  const [regForm, setRegForm] = React.useState({ aadhaarNumber: '', name: '', mobile: '', plotId: '', otp: '' })
  const [otpRequested, setOtpRequested] = React.useState(false)
  const [pubForm, setPubForm] = React.useState({ mobile: '', otp: '' })
  const [pubOtpRequested, setPubOtpRequested] = React.useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      if (portal === 'ecl') {
        const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ portal: 'ecl', email: eclForm.email, password: eclForm.password }) })
        const data = await r.json()
        if (!r.ok) throw new Error(data.error)
        setUser(data.user); setAuthChecked(true); toast.success(data.message); setView('dashboard')
      } else if (mode === 'register') {
        const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(regForm) })
        const data = await r.json()
        if (!r.ok) throw new Error(data.error)
        setUser(data.user); setAuthChecked(true); toast.success(data.message); setView('form-i-wizard')
      } else {
        const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ portal: 'public', mobile: pubForm.mobile, otp: pubForm.otp }) })
        const data = await r.json()
        if (!r.ok) throw new Error(data.error)
        setUser(data.user); setAuthChecked(true); toast.success(data.message); setView('form-i-wizard')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Authentication failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-amber-50/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg">
            <Mountain className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">COALRR</h1>
          <p className="text-sm text-muted-foreground">Coal Land Acquisition, Rehabilitation &amp; Resettlement</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-lg">
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-1">
            <button onClick={() => setPortal('ecl')} className={cn('flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition', portal === 'ecl' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              <ShieldCheck className="h-4 w-4" /> ECL Internal
            </button>
            <button onClick={() => setPortal('public')} className={cn('flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition', portal === 'public' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              <Users className="h-4 w-4" /> Public Citizen
            </button>
          </div>
          {portal === 'public' && (
            <div className="mb-4 flex items-center gap-2 text-xs">
              <button onClick={() => setMode('login')} className={cn('flex-1 rounded-md py-1.5 font-medium transition', mode === 'login' ? 'bg-amber-100 text-amber-800' : 'text-muted-foreground')}>Login</button>
              <button onClick={() => setMode('register')} className={cn('flex-1 rounded-md py-1.5 font-medium transition', mode === 'register' ? 'bg-amber-100 text-amber-800' : 'text-muted-foreground')}>Register</button>
            </div>
          )}
          {portal === 'ecl' && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Official Email</Label>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" value={eclForm.email} onChange={(e) => setEclForm({ ...eclForm, email: e.target.value })} placeholder="unit@coalrr.gov.in" className="pl-9" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Password</Label>
                <div className="relative mt-1">
                  <Lock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" value={eclForm.password} onChange={(e) => setEclForm({ ...eclForm, password: e.target.value })} placeholder="••••••••" className="pl-9" onKeyDown={(e) => e.key === 'Enter' && submit()} />
                </div>
              </div>
              <Alert className="border-sky-200 bg-sky-50">
                <ShieldCheck className="h-4 w-4 text-sky-600" />
                <AlertDescription className="text-xs text-sky-800"><strong>Demo credentials:</strong> password <code className="rounded bg-sky-100 px-1">demo1234</code> for all seeded officers.</AlertDescription>
              </Alert>
              <Button onClick={submit} disabled={loading || !eclForm.email || !eclForm.password} className="w-full bg-amber-600 hover:bg-amber-700">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Sign in to ECL Portal
              </Button>
              <div className="rounded-md bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
                <p className="mb-1 font-medium">Seeded officer accounts:</p>
                <ul className="space-y-0.5 font-mono">
                  <li>unit@coalrr.gov.in — Unit Surveyor</li>
                  <li>area@coalrr.gov.in — Area Land Officer</li>
                  <li>gm.planning@coalrr.gov.in — GM (Planning)</li>
                  <li>cmd@coalrr.gov.in — CMD</li>
                </ul>
              </div>
            </div>
          )}
          {portal === 'public' && mode === 'register' && (
            <div className="space-y-3">
              <Alert className="border-amber-200 bg-amber-50">
                <Fingerprint className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800">Aadhaar-based registration — SHA-256 hashed before storage.</AlertDescription>
              </Alert>
              <div><Label className="text-xs">Full Name (as per Aadhaar)</Label><Input value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} placeholder="e.g. Ramesh Kumar Sahoo" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Aadhaar Number</Label><Input value={regForm.aadhaarNumber} onChange={(e) => setRegForm({ ...regForm, aadhaarNumber: e.target.value.replace(/[^0-9-]/g, '').slice(0, 14) })} placeholder="1234-5678-9012" maxLength={14} /></div>
                <div><Label className="text-xs">Mobile</Label><Input value={regForm.mobile} onChange={(e) => setRegForm({ ...regForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="9876543210" maxLength={10} /></div>
              </div>
              <div><Label className="text-xs">OTP Verification</Label>
                <div className="mt-1 flex gap-2">
                  <Input value={regForm.otp} onChange={(e) => setRegForm({ ...regForm, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="6-digit OTP" className="font-mono" maxLength={6} />
                  <Button type="button" variant="outline" onClick={() => { setOtpRequested(true); toast.success('OTP sent', { description: 'Demo: enter any 6 digits' }) }} disabled={otpRequested || regForm.mobile.length !== 10} className="shrink-0">Send OTP</Button>
                </div>
              </div>
              <Button onClick={submit} disabled={loading || !regForm.name || !regForm.aadhaarNumber || regForm.mobile.length !== 10 || regForm.otp.length !== 6} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Register &amp; Continue
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">Already registered? <button onClick={() => setMode('login')} className="font-medium text-amber-700 hover:underline">Login instead</button></p>
            </div>
          )}
          {portal === 'public' && mode === 'login' && (
            <div className="space-y-3">
              <div><Label className="text-xs">Registered Mobile</Label>
                <div className="relative mt-1">
                  <Phone className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={pubForm.mobile} onChange={(e) => setPubForm({ ...pubForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="9876543210" className="pl-9" maxLength={10} />
                </div>
              </div>
              <div><Label className="text-xs">OTP</Label>
                <div className="mt-1 flex gap-2">
                  <Input value={pubForm.otp} onChange={(e) => setPubForm({ ...pubForm, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="6-digit OTP" className="font-mono" maxLength={6} />
                  <Button type="button" variant="outline" onClick={() => { setPubOtpRequested(true); toast.success('OTP sent', { description: 'Demo: enter any 6 digits' }) }} disabled={pubOtpRequested || pubForm.mobile.length !== 10} className="shrink-0">Send OTP</Button>
                </div>
              </div>
              <Alert className="border-emerald-200 bg-emerald-50">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-xs text-emerald-800"><strong>Demo:</strong> use mobile <code className="rounded bg-emerald-100 px-1">9876543210</code> with any 6-digit OTP.</AlertDescription>
              </Alert>
              <Button onClick={submit} disabled={loading || pubForm.mobile.length !== 10 || pubForm.otp.length !== 6} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />} Login to Public Portal
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">New user? <button onClick={() => setMode('register')} className="font-medium text-amber-700 hover:underline">Register here</button></p>
            </div>
          )}
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">Two portals per spec §1: <strong>ECL Internal</strong> (Unit/Area/HQ officers) &amp; <strong>Public Citizen</strong> (landowners/nominees, Aadhaar-gated).</p>
      </div>
    </div>
  )
}
