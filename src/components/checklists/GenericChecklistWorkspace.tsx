'use client'

import React, { useEffect, useState } from 'react'
import { SectionCard } from '@/components/coalrr'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { getChecklistStatus, updateChecklistSubmission } from '@/app/actions/checklist.actions'
import { CheckCircle2, UploadCloud, AlertTriangle, Eye, FileText, Loader2, Download } from 'lucide-react'
import { DocumentUploader } from '@/components/coalrr'

interface GenericChecklistWorkspaceProps {
  moduleCode: string;
  checkableType: string;
  checkableId: string;
  userId: string;
  title?: string;
  description?: string;
  action?: (isComplete: boolean) => React.ReactNode;
}

export function GenericChecklistWorkspace({ moduleCode, checkableType, checkableId, userId, title = "Project Files & Clearances", description = "Dynamic requirements engine (replaces legacy static clearances)", action }: GenericChecklistWorkspaceProps) {
  const { data, isLoading: loading, refetch, isError, error } = useQuery({
    queryKey: ['checklist', moduleCode, checkableType, checkableId],
    queryFn: async () => {
      console.log('[ChecklistWorkspace] fetching via REST for', checkableId);
      const res = await fetch(`/api/checklists/status?moduleCode=${moduleCode}&checkableType=${checkableType}&checkableId=${checkableId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch checklist');
      }
      return await res.json();
    },
    enabled: !!checkableId
  })

  const handleRealUpload = async (requirementId: string, documentId: string) => {
    try {
      await updateChecklistSubmission({
        moduleCode,
        requirementId,
        checkableType,
        checkableId,
        documentId
      });
      await refetch(); // Refresh checklist UI
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return (
    <SectionCard title="Project Files & Clearances" icon={FileText} description="Uploaded documents and statutory clearances">
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading checklist... ({checkableId})
      </div>
    </SectionCard>
  )
  if (isError) return <div className="p-4 text-red-500">Error loading checklist: {error?.message || 'Unknown error'}</div>
  if (!data) return <div className="p-4 text-red-500">Error: No checklist data returned</div>

  const missingItems = data.items.filter((item: any) => !(item.submission?.status === 'SUBMITTED' || item.submission?.status === 'AUTO_SATISFIED' || item.submission?.status === 'APPROVED'))
  const uploadedItems = data.items.filter((item: any) => item.submission?.status === 'SUBMITTED' || item.submission?.status === 'AUTO_SATISFIED' || item.submission?.status === 'APPROVED')

  const isComplete = missingItems.length === 0;

  return (
    <SectionCard title={title} icon={FileText} description={description}>
      <div className="space-y-6 max-h-[500px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* Missing Clearances Upload */}
        {missingItems.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Required Uploads
            </h4>
            <div className="space-y-3">
              {missingItems.map((item: any) => (
                <div key={item.ruleId} className="rounded-md border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/50 dark:bg-rose-900/10 flex flex-col gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{item.title}</span>
                      <div className="flex items-center gap-2">
                        {item.isMandatory && <Badge variant="destructive" className="text-[10px] py-0 h-4 uppercase tracking-wider">Required</Badge>}
                      </div>
                    </div>
                    {item.description && <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>}
                  </div>
                  <div className="w-full pt-1 border-t border-rose-100 dark:border-rose-900/30">
                    <DocumentUploader
                      checklist_item_key={item.ruleId}
                      mode="single"
                      label="Upload required document"
                      entity_type={checkableType}
                      entity_id={checkableId}
                      module={moduleCode}
                      onChange={(doc: any) => handleRealUpload(item.ruleId, doc.id)}
                    />
                  </div>
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
          {uploadedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No files uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {uploadedItems.map((item: any) => {
                const isInherited = item.submission?.status === 'AUTO_SATISFIED'
                return (
                  <div key={item.ruleId} className="rounded-md border border-emerald-200 bg-emerald-50/30 p-4 dark:border-emerald-900/50 dark:bg-emerald-900/10 flex flex-col gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{item.title}</span>
                        <div className="flex items-center gap-2">
                          {isInherited ? (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px] py-0 h-4 uppercase tracking-wider">Inherited</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px] py-0 h-4 uppercase tracking-wider">Uploaded</Badge>
                          )}
                          <Badge variant="outline" className="font-mono text-[10px] bg-background/50">{item.ruleId}</Badge>
                        </div>
                      </div>
                      {item.description && <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-emerald-100 dark:border-emerald-900/30 gap-3">
                      <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                        <CheckCircle2 className="w-5 h-5" />
                        {isInherited ? 'Automatically satisfied from Project Master' : (
                           item.submission?.updtTs 
                             ? `Uploaded on ${new Date(item.submission.updtTs).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`
                             : 'Successfully Uploaded'
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {item.submission?.userInput && (
                          <div className="text-[10px] text-muted-foreground bg-muted px-2 py-1.5 rounded-md max-w-[250px] truncate">
                            {typeof item.submission.userInput === 'object' ? JSON.stringify(item.submission.userInput) : item.submission.userInput}
                          </div>
                        )}
                        {item.submission?.documentId && (
                          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto text-xs bg-background">
                            <a href={`/api/files/${item.submission.documentId}/download`} target="_blank" rel="noreferrer">
                              <Download className="mr-1.5 h-3.5 w-3.5" />
                              View Document
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        {action && action(isComplete)}
      </div>
    </SectionCard>
  )
}
