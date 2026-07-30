'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { toast } from 'sonner'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    try {
      const r = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Failed to reset password')
      
      setSuccess(true)
      toast.success(data.message)
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center py-4">
        <p className="text-destructive font-medium text-sm">Invalid or missing reset token.</p>
        <Button variant="link" onClick={() => router.push('/')} className="mt-2 text-xs">Return to Login</Button>
      </div>
    )
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-3 py-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h3 className="text-lg font-medium text-foreground">Password Reset Complete</h3>
        <p className="text-sm text-muted-foreground">Your password has been successfully updated.</p>
        <p className="text-xs text-muted-foreground animate-pulse">Redirecting to login...</p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center space-y-1 mb-6">
        <h3 className="text-lg font-medium text-foreground">Create New Password</h3>
        <p className="text-xs text-muted-foreground">Please enter your new password below.</p>
      </div>
      
      <div>
        <Label className="text-xs">New Password</Label>
        <div className="relative mt-1">
          <Lock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="••••••••" 
            className="pl-9" 
            minLength={8}
            required 
          />
        </div>
      </div>
      
      <div>
        <Label className="text-xs">Confirm Password</Label>
        <div className="relative mt-1">
          <Lock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            placeholder="••••••••" 
            className="pl-9" 
            minLength={8}
            required 
          />
        </div>
      </div>

      <Button type="submit" disabled={loading || !password || !confirmPassword} className="w-full bg-emerald-600 hover:bg-emerald-700 mt-6">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Update Password
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-amber-50/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl overflow-hidden shrink-0">
            <img src="/logo.svg" alt="COALRR Logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">COALRR</h1>
          <p className="text-sm text-muted-foreground">Account Recovery</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-lg overflow-hidden">
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
