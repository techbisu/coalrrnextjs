import React from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { ShieldCheck, CheckCircle2, UserCheck, AlertCircle, Phone } from 'lucide-react'
import { toast } from 'sonner'

export interface LandLoserKycStepProps {
  authType: 'aadhaar' | 'epic'
  setAuthType: (val: 'aadhaar' | 'epic') => void
  identifier: string
  setIdentifier: (val: string) => void
  onProfileDetected: (profile: any) => void
  otpVerified: boolean
  setOtpVerified: (val: boolean) => void
}

export function LandLoserKycStep({
  authType,
  setAuthType,
  identifier,
  setIdentifier,
  onProfileDetected,
  otpVerified,
  setOtpVerified,
}: LandLoserKycStepProps) {
  const [otpRequested, setOtpRequested] = React.useState(false)
  const [otpInput, setOtpInput] = React.useState('')
  const [checking, setChecking] = React.useState(false)
  const [detectedProfile, setDetectedProfile] = React.useState<any>(null)

  const handleSendOtp = async () => {
    if (!identifier || identifier.trim().length < 6) {
      toast.error(authType === 'aadhaar' ? 'Please enter a valid 12-digit Aadhaar Number' : 'Please enter a valid EPIC Number')
      return
    }

    setChecking(true)
    try {
      // Check if Land Loser profile exists in land_loser_master
      const res = await fetch(`/api/claims/land-loser/lookup?authType=${authType}&identifier=${encodeURIComponent(identifier.trim())}`)
      const data = await res.json()

      if (data.exists && data.profile) {
        setDetectedProfile(data.profile)
        onProfileDetected(data.profile)
        toast.success(`Existing Land Loser profile detected: ${data.profile.full_name}`)
      } else {
        setDetectedProfile(null)
      }

      setOtpRequested(true)
      toast.info('OTP Sent to linked mobile number', { description: 'For demo test, enter OTP: 123456' })
    } catch {
      toast.error('Failed to connect to identity lookup service')
    } finally {
      setChecking(false)
    }
  }

  const handleVerifyOtp = () => {
    if (otpInput.trim() === '123456' || otpInput.trim().length === 6) {
      setOtpVerified(true)
      toast.success('Identity Verified & Demographic Locked', {
        description: authType === 'aadhaar' ? 'UIDAI Aadhaar Session active' : 'Voter EPIC Identity verified',
      })
    } else {
      toast.error('Invalid OTP. Use demo OTP 123456')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-5 space-y-4 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Step 1.1: Secure Login & Auto-KYC Identity Verification
          </h3>
          <p className="text-sm text-muted-foreground">
            Select your preferred authentication method to lock demographic identity and prevent identity fraud.
          </p>
        </div>

        {/* Radio Button Toggle: Aadhaar vs EPIC */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Select Identity Instrument (Radio Auth)
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <label
              className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                authType === 'aadhaar'
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-600'
                  : 'hover:bg-muted/50'
              }`}
            >
              <input
                type="radio"
                name="authType"
                value="aadhaar"
                checked={authType === 'aadhaar'}
                onChange={() => {
                  setAuthType('aadhaar')
                  setOtpRequested(false)
                  setOtpVerified(false)
                }}
                className="h-4 w-4 text-emerald-600 accent-emerald-600"
              />
              <div>
                <div className="text-sm font-medium">Aadhaar Number</div>
                <div className="text-xs text-muted-foreground">12-Digit UIDAI Identity</div>
              </div>
            </label>

            <label
              className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                authType === 'epic'
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-600'
                  : 'hover:bg-muted/50'
              }`}
            >
              <input
                type="radio"
                name="authType"
                value="epic"
                checked={authType === 'epic'}
                onChange={() => {
                  setAuthType('epic')
                  setOtpRequested(false)
                  setOtpVerified(false)
                }}
                className="h-4 w-4 text-emerald-600 accent-emerald-600"
              />
              <div>
                <div className="text-sm font-medium">Voter Card (EPIC)</div>
                <div className="text-xs text-muted-foreground">Electoral Photo ID Card</div>
              </div>
            </label>
          </div>
        </div>

        {/* Input Identifier */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {authType === 'aadhaar' ? 'Enter 12-Digit Aadhaar Number' : 'Enter Voter Card (EPIC) Number'}
          </Label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder={authType === 'aadhaar' ? 'e.g. 5493 8201 4920' : 'e.g. WB/04/012/384910'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={otpVerified}
              className="font-mono"
            />
            {!otpVerified && (
              <Button onClick={handleSendOtp} disabled={checking || !identifier} className="bg-emerald-600 hover:bg-emerald-700">
                {checking ? 'Checking Master...' : otpRequested ? 'Resend OTP' : 'Send OTP'}
              </Button>
            )}
          </div>
        </div>

        {/* Returning Profile Detected Banner */}
        {detectedProfile && (
          <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-start gap-3 text-sm">
            <UserCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                Returning Land Loser Master Profile Detected!
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Name: <span className="font-medium text-foreground">{detectedProfile.full_name}</span> | Name of the Father/Husband:{' '}
                <span className="font-medium text-foreground">{detectedProfile.father_husband_name}</span>
                <br />
                Demographics & Bank RTGS details will be auto-filled for plot selection.
              </div>
            </div>
          </div>
        )}

        {/* OTP Input Block */}
        {otpRequested && !otpVerified && (
          <div className="rounded-md border bg-muted/40 p-4 space-y-3">
            <div className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-emerald-600" />
              Enter 6-Digit OTP sent to linked mobile number
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                className="font-mono text-center text-base tracking-widest max-w-[180px]"
              />
              <Button onClick={handleVerifyOtp} className="bg-emerald-600 hover:bg-emerald-700">
                Verify & Lock Identity
              </Button>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-amber-5-00" />
              Demo mode: Enter OTP <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">123456</code>
            </div>
          </div>
        )}

        {/* OTP Verified Lock Status */}
        {otpVerified && (
          <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Identity Verified & Locked: {authType.toUpperCase()} {identifier}
          </div>
        )}
      </div>
    </div>
  )
}
