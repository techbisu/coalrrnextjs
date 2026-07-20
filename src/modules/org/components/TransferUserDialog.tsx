'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { useToast } from '@/shared/hooks/use-toast'

interface TransferUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
  onSuccess?: () => void
}

export function TransferUserDialog({ open, onOpenChange, userId, onSuccess }: TransferUserDialogProps) {
  const { toast } = useToast()
  const [scopeLevel, setScopeLevel] = useState<string>('HQ')
  const [areaCd, setAreaCd] = useState('')
  const [mineCd, setMineCd] = useState('')
  const [transferOrderNo, setTransferOrderNo] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTransfer = async () => {
    if (!userId) return
    if (!transferOrderNo) {
      toast({ title: 'Transfer order number is required', variant: 'destructive' })
      return
    }

    try {
      setLoading(true)
      const res = await fetch(`/api/org/users/${userId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newScopeLevel: scopeLevel,
          newAreaCd: areaCd || undefined,
          newMineCd: mineCd || undefined,
          transferOrderNo,
          effectiveFrom: new Date().toISOString()
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to transfer user')
      }

      toast({ title: 'User transferred successfully' })
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer User</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Transfer Order No.</Label>
            <Input value={transferOrderNo} onChange={(e) => setTransferOrderNo(e.target.value)} />
          </div>
          
          <div className="grid gap-2">
            <Label>Scope Level</Label>
            <Select value={scopeLevel} onValueChange={setScopeLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HQ">HQ</SelectItem>
                <SelectItem value="AREA">AREA</SelectItem>
                <SelectItem value="UNIT">UNIT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(scopeLevel === 'AREA' || scopeLevel === 'UNIT') && (
            <div className="grid gap-2">
              <Label>Area Code</Label>
              <Input value={areaCd} onChange={(e) => setAreaCd(e.target.value)} placeholder="e.g. A01" />
            </div>
          )}

          {scopeLevel === 'UNIT' && (
            <div className="grid gap-2">
              <Label>Mine Code</Label>
              <Input value={mineCd} onChange={(e) => setMineCd(e.target.value)} placeholder="e.g. M01" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleTransfer} disabled={loading}>
            {loading ? 'Transferring...' : 'Transfer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
