'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MasterCascade } from '@/core/master-lookup/components/MasterCascade'
import { MasterFormLookup } from '@/core/master-lookup/components/MasterFormLookup'
import { DocumentUploader } from '@/shared/components/coalrr'
import type { UploadedDoc } from '@/shared/components/coalrr'
import { CreateProjectSchema } from '@/application/validators/schemas'
import type { CreateProjectInput } from '@/application/validators/schemas'
import { z } from 'zod'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useAppTranslation } from '@/localization/hooks/useAppTranslation'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import { ProjectWizardForm } from '@/modules/project/components/ProjectWizardForm'

const DialogFormSchema = CreateProjectSchema.extend({
  district_lgd: z.array(z.string()).optional(),
  block_lgd: z.array(z.string()).optional(),
})
type DialogFormInput = z.infer<typeof DialogFormSchema>

export interface ProjectFormValues extends Omit<DialogFormInput, 'user_id' | 'state_lgd' | 'mouza_lgds'> {
  state_lgd?: string
  mouza_lgds?: string[]
  pr_docs?: UploadedDoc[]
}

export function ProjectFormDialog({
  open, onOpenChange, mode, initial, project_id, onSaved, user
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  mode: 'create' | 'edit'
  initial: ProjectFormValues
  project_id?: string
  onSaved?: (id: string) => void
  user?: any
}) {
  const qc = useQueryClient()
  const t = useAppTranslation('project_master')
  const isEdit = mode === 'edit'

  const [uploadedDocs, setUploadedDocs] = React.useState<UploadedDoc[]>(initial.pr_docs || [])
  
  const handleDocUpload = React.useCallback((doc: UploadedDoc | UploadedDoc[]) => {
    if (!Array.isArray(doc)) {
      setUploadedDocs([doc])
    }
  }, [])
  
  const handleDocRemove = React.useCallback((doc: UploadedDoc) => {
    setUploadedDocs(prev => prev.filter(d => d.id !== doc.id))
  }, [])

  const buildFormValues = (iv: ProjectFormValues, u?: any): any => ({
    ...iv,
    state_lgd: u?.state_lgd
      ? String(u.state_lgd)
      : iv.state_lgd
        ? String(iv.state_lgd)
        : undefined,
    mouza_lgds: iv.mouza_lgds ? iv.mouza_lgds.map(String) : undefined,
    area_cd: u?.area_cd || iv.area_cd,
    mine_cds: iv.mine_cds ? iv.mine_cds : u?.mine_cds ? u.mine_cds : [],
    district_lgd: iv.district_lgd || [],
    block_lgd: iv.block_lgd || [],
  })

  const formValues = React.useMemo(() => buildFormValues(initial, user), [initial, user])

  const form = useForm<any>({
    resolver: zodResolver(DialogFormSchema) as any,
    values: formValues,
    mode: 'onTouched',
    reValidateMode: 'onChange',
  })

  const mutation = useMutation({
    mutationFn: async (values: DialogFormInput) => {
      const payload = {
        ...values,
        state_lgd: values.state_lgd ? String(values.state_lgd) : undefined,
        mouza_lgds: values.mouza_lgds ? values.mouza_lgds.map(String) : [],
        pr_doc_id: uploadedDocs.length > 0 ? uploadedDocs[0].id : null,
      }
      
      delete (payload as any).district_lgd
      delete (payload as any).block_lgd

      const url = isEdit ? `/api/projects/${project_id}` : '/api/projects'
      const method = isEdit ? 'PATCH' : 'POST'

      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json?.error ?? t('project_master.save_error', 'Failed to save project'))
      return json
    },
    onSuccess: (data) => {
      toast.success(isEdit 
        ? t('project_master.update_success', 'Project updated.') 
        : t('project_master.create_success', { defaultValue: 'Project created as draft.' })
      )
      qc.invalidateQueries({ queryKey: ['projects'] })
      onOpenChange(false)
      onSaved?.(data.data?.id || data.data?.projCd)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEdit ? 'Edit Project PR Baseline' : 'New Project PR Report Baseline'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update draft baseline details. Once locked, these fields become immutable.'
              : 'Register a new Project Report baseline with Type-wise and Use-wise land limits.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {!isEdit ? (
            /* Render Multi-Step Project Wizard for Create Mode */
            <ProjectWizardForm 
              onSuccess={() => {
                qc.invalidateQueries({ queryKey: ['projects'] })
                onOpenChange(false)
              }}
              onCancel={() => onOpenChange(false)}
            />
          ) : (
            /* Edit Mode Form */
            <Form {...(form as any)}>
              <form onSubmit={onSubmit} className="grid gap-5" id="project-form">
                <FormField
                  control={form.control as any}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Bhubaneswari OCP Phase-III" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>State</Label>
                    <MasterFormLookup
                      control={form.control as any}
                      name="state_lgd"
                      master="state_master"
                      placeholder="Select State..."
                      disabled={!!user?.state_lgd}
                      searchable
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Area</Label>
                    <MasterCascade
                      control={form.control as any}
                      chain={[
                        {
                          master: 'area_master',
                          name: 'area_cd',
                          dependsOn: [{ field: 'state_lgd', param: 'state_lgd' }],
                          placeholder: 'Select Area...',
                          searchable: true
                        }
                      ]}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Mine / Colliery</Label>
                    <MasterCascade
                      control={form.control as any}
                      chain={[
                        {
                          master: 'mine_master',
                          name: 'mine_cds',
                          dependsOn: [{ field: 'area_cd', param: 'area_cd' }],
                          placeholder: 'Select Mine...',
                          searchable: true,
                          isMulti: true
                        }
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="total_land_limit_acres"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Land limit (acres)</FormLabel>
                        <FormControl>
                          <Input {...field} inputMode="decimal" placeholder="450.0000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="total_employment_quota"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment quota</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" inputMode="numeric" placeholder="0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="land_budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Land Budget (INR)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} min="0" step="any" placeholder="0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="rr_budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>R&R Budget (INR)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} min="0" step="any" placeholder="0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4 border-t flex items-center justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={mutation.isPending} form="project-form">
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
