'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Loader2 } from 'lucide-react'
import { MasterLookup } from '@/components/coalrr/MasterLookup'

const scopeSchema = z.object({
  scopeLevel: z.enum(['HQ', 'AREA', 'UNIT']),
  areaCd: z.string().optional(),
  mineCd: z.string().optional(),
})

interface UserScopeDialogProps {
  userId: string
  userName: string
  currentMineCd: string | null
  onSuccess: () => void
}

export function UserScopeDialog({ userId, userName, currentMineCd, onSuccess }: UserScopeDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  
  const form = useForm<z.infer<typeof scopeSchema>>({
    resolver: zodResolver(scopeSchema),
    defaultValues: { scopeLevel: 'UNIT', areaCd: '', mineCd: currentMineCd || '' },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({ scopeLevel: 'UNIT', areaCd: '', mineCd: currentMineCd || '' })
    }
  }, [open, currentMineCd, form])

  const scopeLevel = form.watch('scopeLevel')
  const selectedArea = form.watch('areaCd')

  const prevAreaRef = React.useRef(selectedArea)
  React.useEffect(() => {
    if (prevAreaRef.current !== undefined && prevAreaRef.current !== selectedArea) {
      form.setValue('mineCd', '')
    }
    prevAreaRef.current = selectedArea
  }, [selectedArea, form])

  async function onSubmit(values: z.infer<typeof scopeSchema>) {
    setSaving(true)
    try {
      const res = await fetch(`/api/org/users/${userId}/scope`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scopeLevel: values.scopeLevel,
          areaCd: values.scopeLevel === 'HQ' ? null : values.areaCd,
          mineCd: values.scopeLevel === 'UNIT' ? values.mineCd : null,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to assign scope')
      
      toast.success('Scope assigned successfully')
      setOpen(false)
      onSuccess()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" title="Assign Organizational Scope">
          <MapPin className="h-3.5 w-3.5" />
          Scope
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Assign Scope</DialogTitle>
          <DialogDescription>
            Assign organizational scope for <strong>{userName}</strong>.
            {currentMineCd && ` (Registered with Mine: ${currentMineCd})`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="scopeLevel" render={({ field }) => (
              <FormItem>
                <FormLabel>Scope Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="HQ">Headquarters (All Access)</SelectItem>
                    <SelectItem value="AREA">Area Level</SelectItem>
                    <SelectItem value="UNIT">Unit / Mine Level</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {scopeLevel !== 'HQ' && (
              <FormField control={form.control} name="areaCd" render={({ field }) => (
                <FormItem className="flex flex-col mt-2">
                  <FormLabel>Area</FormLabel>
                  <MasterLookup 
                    masterName="area_master"
                    value={field.value} 
                    onChange={field.onChange} 
                    placeholder="Select Area"
                  />
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {scopeLevel === 'UNIT' && (
              <FormField control={form.control} name="mineCd" render={({ field }) => (
                <FormItem className="flex flex-col mt-2">
                  <FormLabel>Mine / Unit</FormLabel>
                  <MasterLookup 
                    masterName="mine_master"
                    dependencies={{ area_cd: selectedArea }}
                    value={field.value} 
                    onChange={field.onChange} 
                    placeholder="Select Mine"
                    disabled={!selectedArea}
                  />
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Confirm Assignment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
