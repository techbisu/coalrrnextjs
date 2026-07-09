'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CaptchaProps {
  purpose: string
  onVerified?: (captchaId: string) => void
  className?: string
}

type CaptchaState = 'loading' | 'idle' | 'validating' | 'success' | 'error'

export function Captcha({ purpose, onVerified, className }: CaptchaProps) {
  const [captchaId, setCaptchaId] = React.useState<string | null>(null)
  const [challenge, setChallenge] = React.useState<string>('')
  const [answer, setAnswer] = React.useState<string>('')
  const [state, setState] = React.useState<CaptchaState>('loading')
  const [errorMsg, setErrorMsg] = React.useState<string>('')

  const fetchChallenge = React.useCallback(async (isRefresh = false) => {
    setState('loading')
    setErrorMsg('')
    setAnswer('')
    try {
      const url = isRefresh && captchaId ? '/api/captcha/refresh' : '/api/captcha/generate'
      const payload = isRefresh && captchaId ? { id: captchaId, purpose } : { purpose }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to load CAPTCHA')
      
      const data = await res.json()
      setCaptchaId(data.id)
      setChallenge(data.challenge)
      setState('idle')
    } catch (err: any) {
      setState('error')
      setErrorMsg(err.message || 'Connection error')
    }
  }, [purpose, captchaId])

  React.useEffect(() => {
    fetchChallenge()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dep array to run once on mount

  const lastValidatedAnswer = React.useRef<string>('')

  const handleValidate = React.useCallback(async () => {
    if (!answer.trim() || !captchaId) return
    
    // Prevent repeated validation of the exact same wrong answer
    if (answer === lastValidatedAnswer.current) return

    setState('validating')
    setErrorMsg('')
    lastValidatedAnswer.current = answer

    try {
      const res = await fetch('/api/captcha/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: captchaId, answer })
      })
      const data = await res.json()

      if (data.valid) {
        setState('success')
        onVerified?.(captchaId)
      } else {
        setState('error')
        setErrorMsg(data.reason || 'Incorrect answer')
        
        // If too many attempts or expired, we need a new challenge
        if (data.reason?.toLowerCase().includes('expired') || data.reason?.toLowerCase().includes('too many')) {
          setCaptchaId(null) // force new generation
          setTimeout(() => fetchChallenge(), 2000) // fetch new after showing error briefly
        }
      }
    } catch (err) {
      setState('error')
      setErrorMsg('Validation failed to reach server')
    }
  }, [answer, captchaId, fetchChallenge, onVerified])

  React.useEffect(() => {
    if (!answer.trim() || !captchaId || state === 'validating' || state === 'success') return
    if (answer === lastValidatedAnswer.current) return // Stop debounce loop on error
    
    const timer = setTimeout(() => {
      handleValidate()
    }, 800)
    return () => clearTimeout(timer)
  }, [answer, captchaId, state, handleValidate])

  if (state === 'success') {
    return (
      <div className={cn("flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 p-2.5 rounded-md border border-emerald-200 dark:border-emerald-900/50", className)}>
        <CheckCircle className="w-4 h-4 shrink-0" />
        <span className="font-medium text-[13px]">Security Check Passed</span>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-foreground">
          Security Check <span className="text-muted-foreground font-normal ml-1">Solve to continue</span>
        </Label>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => fetchChallenge(true)}
          disabled={state === 'loading' || state === 'validating'}
          title="Get a new challenge"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", state === 'loading' && "animate-spin")} />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div 
          className="relative flex-1 rounded-md py-1.5 px-3 border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 text-center font-mono text-base font-bold tracking-[0.15em] select-none text-amber-950 dark:text-amber-400 shadow-inner overflow-hidden"
        >
          {/* Subtle noise/dot texture overlay */}
          <div 
            className="absolute inset-0 opacity-[0.08] dark:opacity-[0.04] pointer-events-none mix-blend-multiply dark:mix-blend-overlay" 
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'12\' viewBox=\'0 0 12 12\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M5 5h2v2H5V5zm4 4h2v2H9V9zM1 1h2v2H1V1zm8 0h2v2H9V1zM1 9h2v2H1V9z\' fill=\'%23000000\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }}
          />
          <div className="relative z-10 flex items-center justify-center filter drop-shadow-sm">
            {state === 'loading' && !challenge ? (
               <span className="flex items-center justify-center opacity-60"><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /></span>
            ) : challenge}
          </div>
        </div>
        {/* Only show equals sign for math challenges */}
        {(challenge.includes('+') || challenge.includes('-') || challenge.includes('×') || challenge.includes('÷')) && (
          <span className="text-muted-foreground font-mono text-sm font-medium opacity-70">=</span>
        )}
        <div className="relative w-20 shrink-0">
          <Input 
            type="text"
            placeholder="?"
            className="w-full text-center font-mono text-sm h-8 pr-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onBlur={handleValidate}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleValidate()
              }
            }}
            disabled={state === 'loading' || state === 'validating'}
            autoComplete="off"
          />
          {state === 'validating' && (
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {state === 'error' && errorMsg && (
        <div className="flex items-center gap-1.5 text-[12px] text-destructive mt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}
    </div>
  )
}
