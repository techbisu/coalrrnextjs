'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MasterCascade } from '@/core/master-lookup/components/MasterCascade'
import { MasterFormLookup } from '@/core/master-lookup/components/MasterFormLookup'
import { DocumentUploader } from '@/components/coalrr'
import type { UploadedDoc } from '@/components/coalrr'
import { CreateProjectSchema } from '@/application/validators/schemas'
import type { CreateProjectInput } from '@/application/validators/schemas'
import { z } from 'zod'

const DialogFormSchema = CreateProjectSchema.extend({
  district_lgd: z.string().optional(),
  block_lgd: z.string().optional(),
})
type DialogFormInput = z.infer<typeof DialogFormSchema>
import { useQueryClient, useMutation } from '@tanstack/react-query'
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useAppTranslation } from '@/localization/hooks/useAppTranslation'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

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
    // state_lgd: keep as string for UI. Zod coerces to BigInt on validation.
    state_lgd: u?.state_lgd
      ? String(u.state_lgd)
      : iv.state_lgd
        ? String(iv.state_lgd)
        : undefined,
    mouza_lgds: iv.mouza_lgds ? iv.mouza_lgds.map(String) : undefined,
    area_cd: u?.area_cd || iv.area_cd,
    mine_cd: u?.mine_cd || iv.mine_cd,
    // district_lgd / block_lgd stay as strings — they're UI-only cascade parents, stripped before submit
    district_lgd: u?.district_lgd ? String(u.district_lgd) : iv.district_lgd ? String(iv.district_lgd) : undefined,
    block_lgd: u?.block_lgd ? String(u.block_lgd) : iv.block_lgd ? String(iv.block_lgd) : undefined,
  })

  const formValues = React.useMemo(() => buildFormValues(initial, user), [initial, user])

  const form = useForm<any>({
    resolver: zodResolver(DialogFormSchema) as any,
    values: formValues
  })

  const mutation = useMutation({
    mutationFn: async (values: DialogFormInput) => {
      const payload = {
        ...values,
        state_lgd: values.state_lgd ? String(values.state_lgd) : undefined,
        mouza_lgds: values.mouza_lgds ? values.mouza_lgds.map(String) : [],
        pr_doc_id: uploadedDocs.length > 0 ? uploadedDocs[0].id : null,
      }
      
      // Strip UI-only fields
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
        : t('project_master.create_success', { defaultValue: 'Project "{{name}}" created as draft.', name: data.data.name })
      )
      qc.invalidateQueries({ queryKey: ['projects'] })
      onOpenChange(false)
      onSaved?.(data.data.id)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data)
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>{isEdit ? t('project_master.edit_baseline', 'Edit Project Baseline') : t('project_master.new_project', 'New Project')}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? t('project_master.edit_baseline_desc', 'Update draft baseline details. Once locked, these fields become immutable.')
              : t('project_master.new_project_desc', 'Create a new draft project baseline. The baseline can be edited until it is locked.')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
        <Form {...(form as any)}>
          <form onSubmit={onSubmit} className="grid gap-5" id="project-form">
            <FormField
              control={form.control as any}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('project_master.fields.name', 'Project name')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('project_master.fields.name_ph', 'e.g. Bhubaneswari OCP Phase-III')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t('project_master.fields.state', 'State')}</Label>
                <MasterFormLookup
                  control={form.control as any}
                  name="state_lgd"
                  master="state_master"
                  placeholder={t('project_master.fields.state_ph', 'Select State...')}
                  disabled={!!user?.state_lgd}
                  searchable
                />
              </div>
              
              <div className="grid gap-2">
                <Label>{t('project_master.fields.area', 'Area')}</Label>
                <MasterCascade
                  control={form.control as any}
                  chain={[
                    {
                      master: 'area_master',
                      name: 'area_cd',
                      dependsOn: [{ field: 'state_lgd', param: 'state_lgd' }],
                      placeholder: t('project_master.fields.area_ph', 'Select Area...'),
                      searchable: true
                    }
                  ]}
                />
              </div>
              
              <div className="grid gap-2">
                <Label>{t('project_master.fields.mine', 'Mine / Colliery')}</Label>
                <MasterCascade
                  control={form.control as any}
                  chain={[
                    {
                      master: 'mine_master',
                      name: 'mine_cd',
                      dependsOn: [{ field: 'area_cd', param: 'area_cd' }],
                      placeholder: t('project_master.fields.mine_ph', 'Select Mine...'),
                      searchable: true
                    }
                  ]}
                />
              </div>

              <div className="grid gap-2">
                <Label>{t('project_master.fields.district', 'District')}</Label>
                <MasterCascade
                  control={form.control as any}
                  chain={[
                    {
                      master: 'district_master',
                      name: 'district_lgd',
                      dependsOn: [{ field: 'state_lgd', param: 'state_lgd' }],
                      placeholder: t('project_master.fields.district_ph', 'Select District...'),
                      searchable: true
                    }
                  ]}
                />
              </div>

              <div className="grid gap-2">
                <Label>{t('project_master.fields.block', 'Block')}</Label>
                <MasterCascade
                  control={form.control as any}
                  chain={[
                    {
                      master: 'block_master',
                      name: 'block_lgd',
                      dependsOn: [{ field: 'district_lgd', param: 'district_lgd' }],
                      placeholder: t('project_master.fields.block_ph', 'Select Block...'),
                      searchable: true
                    }
                  ]}
                />
              </div>

              <div className="grid gap-2">
                <Label>{t('project_master.fields.mouzas', 'Mapped Mouzas')}</Label>
                <MasterCascade
                  control={form.control as any}
                  chain={[
                    {
                      master: 'mouza_master',
                      name: 'mouza_lgds',
                      dependsOn: [{ field: 'block_lgd', param: 'block_lgd' }],
                      placeholder: t('project_master.fields.mouzas_ph', 'Select Mouzas...'),
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
                    <FormLabel>{t('project_master.fields.land_limit', 'Land limit (acres)')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode="decimal"
                        placeholder="450.0000"
                      />
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
                    <FormLabel>{t('project_master.fields.employment_quota', 'Employment quota')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                      />
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
                    <FormLabel>{t('project_master.fields.land_budget', 'Land Budget (INR)')}</FormLabel>
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
                    <FormLabel>{t('project_master.fields.rr_budget', 'R&R Budget (INR)')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} min="0" step="any" placeholder="0" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t('project_master.fields.pr_doc', 'Approved PR Document')}</Label>
              <DocumentUploader
                checklist_item_key="PR-DOCS"
                mode="single"
                label={t('project_master.fields.pr_doc_upload', 'Upload document')}
                documents={uploadedDocs}
                onChange={handleDocUpload}
                onRemove={handleDocRemove}
                entity_type="mst_project"
                entity_id={project_id}
                module="project-master"
              />
            </div>
          </form>
        </Form>
        </div>

        <div className="mt-auto p-4 border-t flex items-center justify-between bg-background">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto mr-2">
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" disabled={mutation.isPending} form="project-form" className="w-full sm:w-auto ml-2">
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? t('common.save_changes', 'Save Changes') : t('project_master.create_project', 'Create Project')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
