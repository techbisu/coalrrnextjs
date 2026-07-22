import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { SectionCard, DocumentUploader, UploadedDoc } from '@/components/coalrr'
import { toast } from 'sonner'
import { AlertTriangle, FileText, CheckCircle2, Loader2, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAppTranslation } from '@/localization/hooks/useAppTranslation'
import { ClearanceRequirementService } from '@/core/compliance/services/ClearanceRequirementService'

export function ProjectFilesSection({ projectId, prDocs = [] }: { projectId: string; prDocs?: UploadedDoc[] }) {
  const t = useAppTranslation('project_master')
  const { data, isLoading, refetch } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['project-files', projectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/files`)
      if (!r.ok) throw new Error('Failed to load files')
      return r.json()
    },
    enabled: !!projectId,
  })

  const allFiles = React.useMemo(() => {
    const fetched = data?.data ?? []
    const existingIds = new Set(fetched.map((f: any) => f.id || f.file_id))
    const merged = [...fetched]
    for (const doc of prDocs) {
      if (!existingIds.has(doc.id)) {
        merged.push({
          id: doc.id,
          file_name: doc.file_name,
          file_size_kb: doc.file_size_kb,
          entry_ts: doc.entry_ts || new Date().toISOString(),
          checklist_item_key: 'PR_DOC'
        })
      }
    }
    return merged
  }, [data, prDocs])

  const requiredClearances = React.useMemo(() => {
    return ClearanceRequirementService.getProjectLevelRequirements()
  }, [])

  const missingClearances = requiredClearances.filter(
    req => !allFiles.some((f: any) => f.checklist_item_key?.split(',').includes(req.key))
  )

  const handleUploadSuccess = () => {
    refetch()
    toast.success('Document uploaded successfully')
  }

  return (
    <SectionCard title={t('project_master.files.title', 'Project Files & Clearances')} icon={FileText} description={t('project_master.files.desc', 'Uploaded documents and statutory clearances')}>
      <div className="space-y-6 max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Missing Clearances Upload */}
        {missingClearances.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Required Uploads
            </h4>
            <div className="space-y-3">
              {missingClearances.map(c => (
                <div key={c.key} className="rounded-md border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-900/50 dark:bg-rose-900/10">
                  <DocumentUploader
                    checklist_item_key={c.key}
                    label={c.label}
                    mode="single"
                    entity_type="project-master"
                    entity_id={projectId}
                    module={c.key}
                    onChange={handleUploadSuccess}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded Files List */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Uploaded Documents
          </h4>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading files...
            </div>
          ) : allFiles.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No files uploaded yet.</p>
          ) : (
            <ul className="space-y-2">
              {allFiles.map((f: any) => (
                <li key={f.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border bg-card gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" title={f.file_name}>{f.file_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span>{(f.file_size_kb).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>{new Date(f.entry_ts).toLocaleDateString()}</span>
                        {f.checklist_item_key && f.checklist_item_key.split(',').map((key: string) => (
                          <React.Fragment key={key}>
                            <span>•</span>
                            <Badge variant="secondary" className="text-[10px] py-0">{key}</Badge>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                      <a href={`/api/files/${f.id}/download`} target="_blank" rel="noreferrer">
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        View
                      </a>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SectionCard>
  )
}
