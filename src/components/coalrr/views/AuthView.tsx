'use client'

import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/authorization/providers/AuthProvider'
import { useUiState } from '@/providers/UiStateProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Mountain, ShieldCheck, Users, Mail, Phone, Lock, Fingerprint, Loader2, CheckCircle2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Captcha } from '@/components/captcha/Captcha'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/shared/components/ui/input-otp'
import { motion, AnimatePresence } from 'framer-motion'

type Portal = 'ecl' | 'public'
type Mode = 'login' | 'register'

export function AuthView() {
  const [portal, setPortal] = React.useState<Portal>('ecl')
  const [mode, setMode] = React.useState<Mode>('login')
  const [loading, setLoading] = React.useState(false)
  const { setView } = useUiState()
  const [eclForm, setEclForm] = React.useState({ email: '', password: '' })
  const [regForm, setRegForm] = React.useState({ aadhaarNumber: '', name: '', mobile: '', plot_id: '', otp: '' })
  const [otpRequested, setOtpRequested] = React.useState(false)
  const [pubForm, setPubForm] = React.useState({ mobile: '', otp: '' })
  const [pubOtpRequested, setPubOtpRequested] = React.useState(false)
  const [eclCaptchaVerified, setEclCaptchaVerified] = React.useState(false)
  const [regCaptchaVerified, setRegCaptchaVerified] = React.useState(false)
  const [pubCaptchaVerified, setPubCaptchaVerified] = React.useState(false)

  // OTP Flow State
  const [authStep, setAuthStep] = React.useState<'credentials' | 'otp'>('credentials')
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [otpValue, setOtpValue] = React.useState('')
  const [resending, setResending] = React.useState(false)
  const [expiresIn, setExpiresIn] = React.useState(600)
  const [resendCooldown, setResendCooldown] = React.useState(30)

  React.useEffect(() => {
    let timer: NodeJS.Timeout
    if (authStep === 'otp') {
      timer = setInterval(() => {
        setExpiresIn(prev => (prev > 0 ? prev - 1 : 0))
        setResendCooldown(prev => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [authStep, sessionId])

  const queryClient = useQueryClient()

  const submitCredentials = async () => {
    setLoading(true)
    try {
      if (portal === 'ecl') {
        const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ portal: 'ecl', email: eclForm.email, password: eclForm.password }) })
        const data = await r.json()
        if (!r.ok) throw new Error(data.error)
        
        if (data.requireOtp) {
          setSessionId(data.sessionId)
          setExpiresIn(600)
          setResendCooldown(30)
          setAuthStep('otp')
          toast.success(data.message, data.devOtp ? { description: `[DEV ONLY] OTP is: ${data.devOtp}`, duration: 10000 } : undefined)
        } else {
          await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
          toast.success(data.message); setView('dashboard')
        }
      } else if (mode === 'register') {
        const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(regForm) })
        const data = await r.json()
        if (!r.ok) throw new Error(data.error)
        await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        toast.success(data.message); setView('form-i-wizard')
      } else {
        const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ portal: 'public', mobile: pubForm.mobile }) })
        const data = await r.json()
        if (!r.ok) throw new Error(data.error)
        
        setSessionId(data.sessionId)
        setExpiresIn(600)
        setResendCooldown(30)
        setAuthStep('otp')
        toast.success(data.message, data.devOtp ? { description: `[DEV ONLY] OTP is: ${data.devOtp}`, duration: 10000 } : undefined)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Authentication failed')
    } finally { setLoading(false) }
  }

  const submitOTP = async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const r = await fetch('/api/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, otp: otpValue }) })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      toast.success(data.message)
      setView(portal === 'ecl' ? 'dashboard' : 'form-i-wizard')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'OTP Verification failed')
    } finally { setLoading(false) }
  }

  const handleResendOTP = async () => {
    if (!sessionId || resendCooldown > 0) return
    setResending(true)
    try {
      const r = await fetch('/api/auth/resend-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      toast.success(data.message, data.devOtp ? { description: `[DEV ONLY] Resent OTP is: ${data.devOtp}`, duration: 10000 } : undefined)
      setResendCooldown(30)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to resend OTP')
    } finally { setResending(false) }
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
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-lg overflow-hidden">
          <AnimatePresence mode="wait">
            {authStep === 'credentials' ? (
              <motion.div 
                key="credentials"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
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
                  <Input type="password" value={eclForm.password} onChange={(e) => setEclForm({ ...eclForm, password: e.target.value })} placeholder="••••••••" className="pl-9" onKeyDown={(e) => e.key === 'Enter' && submitCredentials()} />
                </div>
              </div>
              <Alert className="border-sky-200 bg-sky-50">
                <ShieldCheck className="h-4 w-4 text-sky-600" />
                <AlertDescription className="text-xs text-sky-800"><strong>Demo credentials:</strong> password <code className="rounded bg-sky-100 px-1">demo1234</code> for all seeded officers.</AlertDescription>
              </Alert>
              <Captcha purpose="ecl-login" onVerified={() => setEclCaptchaVerified(true)} />
              <Button onClick={submitCredentials} disabled={loading || !eclForm.email || !eclForm.password || !eclCaptchaVerified} className="w-full bg-amber-600 hover:bg-amber-700">
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
              <Captcha purpose="public-register" onVerified={() => setRegCaptchaVerified(true)} />
              <Button onClick={submitCredentials} disabled={loading || !regForm.name || !regForm.aadhaarNumber || regForm.mobile.length !== 10 || regForm.otp.length !== 6 || !regCaptchaVerified} className="w-full bg-emerald-600 hover:bg-emerald-700">
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
              <Captcha purpose="public-login" onVerified={() => setPubCaptchaVerified(true)} />
              <Button onClick={submitCredentials} disabled={loading || pubForm.mobile.length !== 10 || !pubCaptchaVerified} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Continue to OTP
              </Button>
                <p className="text-center text-[11px] text-muted-foreground">New user? <button onClick={() => setMode('register')} className="font-medium text-amber-700 hover:underline">Register here</button></p>
              </div>
            )}
              </motion.div>
            ) : (
              <motion.div 
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1">
                <h3 className="text-lg font-medium text-foreground">Verification Required</h3>
                <p className="text-xs text-muted-foreground">Please enter the 6-digit OTP sent to your contact.</p>
                {expiresIn > 0 ? (
                  <p className="text-[11px] text-amber-600 font-medium">Code expires in {Math.floor(expiresIn / 60)}:{(expiresIn % 60).toString().padStart(2, '0')}</p>
                ) : (
                  <p className="text-[11px] text-destructive font-medium">Code expired. Please request a new one.</p>
                )}
              </div>
              <div className="flex justify-center py-2">
                <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue} autoFocus>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-10 h-12 text-lg font-medium bg-muted/20 border-border" />
                    <InputOTPSlot index={1} className="w-10 h-12 text-lg font-medium bg-muted/20 border-border" />
                    <InputOTPSlot index={2} className="w-10 h-12 text-lg font-medium bg-muted/20 border-border" />
                    <InputOTPSlot index={3} className="w-10 h-12 text-lg font-medium bg-muted/20 border-border" />
                    <InputOTPSlot index={4} className="w-10 h-12 text-lg font-medium bg-muted/20 border-border" />
                    <InputOTPSlot index={5} className="w-10 h-12 text-lg font-medium bg-muted/20 border-border" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={submitOTP} disabled={loading || otpValue.length !== 6 || expiresIn === 0} className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />} Verify OTP &amp; Login
                </Button>
                <Button variant="ghost" onClick={handleResendOTP} disabled={resending || resendCooldown > 0} className="w-full text-xs h-8 text-muted-foreground hover:text-foreground transition-colors">
                  {resending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                  {resendCooldown > 0 ? `Resend code in 00:${resendCooldown.toString().padStart(2, '0')}` : "Didn't receive code? Resend"}
                </Button>
                <Button variant="link" onClick={() => setAuthStep('credentials')} className="w-full text-[11px] h-8 text-amber-700/80 hover:text-amber-700">
                  ← Back to login
                </Button>
              </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">Two portals per spec §1: <strong>ECL Internal</strong> (Unit/Area/HQ officers) &amp; <strong>Public Citizen</strong> (landowners/nominees, Aadhaar-gated).</p>
      </div>
    </div>
  )
}

